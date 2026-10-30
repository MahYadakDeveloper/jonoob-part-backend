-- KEYS[i]              : bucket key (i = 1..N)
-- ARGV[1]              : now (seconds, fractional)
-- ARGV[2i], ARGV[2i+1] : max_tokens, refill_rate of bucket i
--
-- Returns:
--   allowed  -> { 1, remaining }
--   rejected -> { 0, failed_bucket_index (1-based), remaining, limit, retry_after }

local now = tonumber(ARGV[1])
local count = #KEYS

if not now or count == 0 then
  return redis.error_reply('ERR invalid arguments')
end

local buckets = {}
local failed = nil

-- Phase 1: check all buckets without consuming
for i = 1, count do
  local key = KEYS[i]
  local max_tokens = tonumber(ARGV[2 + (i - 1) * 2])
  local refill_rate = tonumber(ARGV[3 + (i - 1) * 2])

  -- Validate before any write happens (avoids division by zero / NaN / inf)
  if not max_tokens or not refill_rate or max_tokens < 1 or refill_rate <= 0 then
    return redis.error_reply('ERR invalid bucket config at index ' .. i)
  end

  -- Missing fields come back as false; tonumber(false) == nil -> falls back to default
  local stored = redis.call('HMGET', key, 'tokens', 'last_refill')
  local tokens = tonumber(stored[1]) or max_tokens
  local last_refill = tonumber(stored[2]) or now

  -- Clamp: client clock skew must never make elapsed negative
  local elapsed = math.max(0, now - last_refill)
  tokens = math.min(max_tokens, tokens + elapsed * refill_rate)

  buckets[i] = {
    key = key,
    tokens = tokens,
    max_tokens = max_tokens,
    refill_rate = refill_rate,
  }

  if tokens < 1 then
    local retry_after = math.ceil((1 - tokens) / refill_rate)

    -- Report the bucket the client must wait on the longest,
    -- otherwise the client retries too early and is rejected again
    if failed == nil or retry_after > failed[4] then
      failed = { i, math.floor(tokens), max_tokens, retry_after }
    end
  end
end

if failed ~= nil then
  return { 0, failed[1], failed[2], failed[3], failed[4] }
end

-- Phase 2: all buckets allowed, consume one token from each
local min_remaining = nil

for i = 1, count do
  local bucket = buckets[i]
  local tokens = bucket.tokens - 1

  -- tostring() keeps only 14 significant digits, which truncates the
  -- sub-millisecond part of a unix timestamp. Use explicit precision.
  redis.call(
    'HSET',
    bucket.key,
    'tokens', string.format('%.6f', tokens),
    'last_refill', string.format('%.6f', now)
  )

  redis.call(
    'EXPIRE',
    bucket.key,
    math.ceil(bucket.max_tokens / bucket.refill_rate) + 1
  )

  if min_remaining == nil or tokens < min_remaining then
    min_remaining = tokens
  end
end

return { 1, math.floor(min_remaining) }
