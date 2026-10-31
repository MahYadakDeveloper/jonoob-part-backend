import { createHash } from 'node:crypto';

/**
 * One script for every algorithm and for both "check" and "consume".
 *
 * KEYS[i]   one Redis key per rule (all must live in the same cluster slot,
 *           e.g. use a hash tag: `otp:{+98912...}:cooldown`)
 * ARGV[1]   mode: '0' = check only, '1' = check + consume
 * ARGV[2]   unique request id (member suffix for sliding-window-log)
 * ARGV[3+]  3 values per rule: algorithm, p1, p2
 *             token-bucket           p1 = maxTokens, p2 = refillRate (tokens/sec)
 *             fixed-window           p1 = limit,     p2 = windowSeconds
 *             sliding-window-log     p1 = limit,     p2 = windowSeconds
 *             sliding-window-counter p1 = limit,     p2 = windowSeconds
 *
 * Returns { allowed(1|0), ruleIndex(1-based), remaining, limit, retryAfter }
 *   allowed = 1 -> ruleIndex = tightest rule
 *   allowed = 0 -> ruleIndex = rule with the longest wait
 *
 * Time comes from Redis (TIME), so app instances with skewed clocks agree.
 * Requires Redis >= 5 (TIME followed by writes inside a script).
 */
export const RATE_LIMIT_SCRIPT = `
local mode = ARGV[1]
local request_id = ARGV[2]

local t = redis.call('TIME')
local now = tonumber(t[1]) + tonumber(t[2]) / 1000000
local now_ms = tonumber(t[1]) * 1000 + math.floor(tonumber(t[2]) / 1000)

-- tostring() would turn big numbers into 1.76e+15 and lose precision
local function int_str(n) return string.format('%.0f', n) end
local function dec_str(n) return string.format('%.6f', n) end

local function token_bucket(key, max_tokens, refill_rate)
  local d = redis.call('HMGET', key, 'tokens', 'ts')
  local tokens = tonumber(d[1])
  local ts = tonumber(d[2])
  if tokens == nil or ts == nil then
    tokens = max_tokens
    ts = now
  end

  tokens = math.min(max_tokens, tokens + math.max(0, now - ts) * refill_rate)

  local allowed = tokens >= 1
  local retry = 0
  if not allowed then
    retry = math.ceil((1 - tokens) / refill_rate)
  end

  return {
    allowed = allowed,
    available = math.floor(tokens),
    limit = max_tokens,
    retry = retry,
    commit = function()
      redis.call('HSET', key, 'tokens', dec_str(tokens - 1), 'ts', dec_str(now))
      redis.call('EXPIRE', key, math.ceil(max_tokens / refill_rate) + 1)
    end,
  }
end

local function fixed_window(key, limit, window)
  local count = tonumber(redis.call('GET', key)) or 0
  local allowed = count < limit
  local retry = 0
  if not allowed then
    local ttl_ms = redis.call('PTTL', key)
    if ttl_ms < 0 then ttl_ms = window * 1000 end
    retry = math.max(1, math.ceil(ttl_ms / 1000))
  end

  return {
    allowed = allowed,
    available = math.max(0, limit - count),
    limit = limit,
    retry = retry,
    commit = function()
      if redis.call('INCR', key) == 1 then
        redis.call('PEXPIRE', key, math.ceil(window * 1000))
      end
    end,
  }
end

local function sliding_window_log(key, limit, window)
  local window_ms = window * 1000
  local cutoff = now_ms - window_ms
  local count = redis.call('ZCOUNT', key, '(' .. int_str(cutoff), '+inf')
  local allowed = count < limit
  local retry = 0
  if not allowed then
    -- the entry that must leave the window before a new request fits
    local pivot = redis.call(
      'ZRANGEBYSCORE', key, '(' .. int_str(cutoff), '+inf',
      'WITHSCORES', 'LIMIT', count - limit, 1
    )
    if pivot[2] ~= nil then
      retry = math.ceil((tonumber(pivot[2]) + window_ms - now_ms) / 1000)
    end
    retry = math.max(1, retry)
  end

  return {
    allowed = allowed,
    available = math.max(0, limit - count),
    limit = limit,
    retry = retry,
    commit = function()
      redis.call('ZREMRANGEBYSCORE', key, '-inf', int_str(cutoff))
      redis.call('ZADD', key, int_str(now_ms), int_str(now_ms) .. ':' .. request_id)
      redis.call('PEXPIRE', key, math.ceil(window_ms) + 1000)
    end,
  }
end

local function sliding_window_counter(key, limit, window)
  local idx = math.floor(now / window)
  local d = redis.call('HMGET', key, 'w', 'cur', 'prev')
  local w = tonumber(d[1])
  local cur = tonumber(d[2]) or 0
  local prev = tonumber(d[3]) or 0

  if w == nil then
    cur = 0
    prev = 0
  elseif w == idx - 1 then
    prev = cur
    cur = 0
  elseif w ~= idx then
    cur = 0
    prev = 0
  end

  local frac = (now - idx * window) / window
  local estimated = prev * (1 - frac) + cur
  local allowed = estimated + 1 <= limit + 1e-9
  local retry = 0

  if not allowed then
    -- moment (in window units) when estimated drops to limit - 1
    local target
    if cur <= limit - 1 and prev > 0 then
      target = idx + 1 - (limit - 1 - cur) / prev
    else
      -- current window alone is full: wait until it becomes the "previous" one
      target = idx + 2 - (limit - 1) / cur
    end
    retry = math.max(1, math.ceil(target * window - now))
  end

  return {
    allowed = allowed,
    available = math.max(0, math.floor(limit - estimated + 1e-9)),
    limit = limit,
    retry = retry,
    commit = function()
      redis.call('HSET', key, 'w', int_str(idx), 'cur', int_str(cur + 1), 'prev', int_str(prev))
      redis.call('PEXPIRE', key, math.ceil(window * 2000) + 1000)
    end,
  }
end

local count = #KEYS
local evals = {}
local worst = nil
local tightest = 1

for i = 1, count do
  local base = 3 + (i - 1) * 3
  local algorithm = ARGV[base]
  local p1 = tonumber(ARGV[base + 1])
  local p2 = tonumber(ARGV[base + 2])

  local r
  if algorithm == 'token-bucket' then
    r = token_bucket(KEYS[i], p1, p2)
  elseif algorithm == 'fixed-window' then
    r = fixed_window(KEYS[i], p1, p2)
  elseif algorithm == 'sliding-window-log' then
    r = sliding_window_log(KEYS[i], p1, p2)
  elseif algorithm == 'sliding-window-counter' then
    r = sliding_window_counter(KEYS[i], p1, p2)
  else
    error('unknown rate limit algorithm: ' .. tostring(algorithm))
  end

  r.index = i
  evals[i] = r

  if not r.allowed and (worst == nil or r.retry > worst.retry) then
    worst = r
  end
  if r.available < evals[tightest].available then
    tightest = i
  end
end

-- Any rule rejected -> nothing is consumed anywhere
if worst ~= nil then
  return { 0, worst.index, worst.available, math.floor(worst.limit), worst.retry }
end

local remaining = evals[tightest].available
if mode == '1' then
  for i = 1, count do
    evals[i].commit()
  end
  remaining = remaining - 1
end

return { 1, tightest, remaining, math.floor(evals[tightest].limit), 0 }
`;

export const RATE_LIMIT_SCRIPT_SHA = createHash('sha1')
  .update(RATE_LIMIT_SCRIPT)
  .digest('hex');
