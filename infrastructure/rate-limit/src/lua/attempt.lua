local now = tonumber(ARGV[1])
local count = #KEYS

local failed = nil
local buckets = {}

-- Check all buckets without consuming
for i = 1, count do
  local key = KEYS[i]

  local max_tokens = tonumber(ARGV[2 + (i - 1) * 2])
  local refill_rate = tonumber(ARGV[3 + (i - 1) * 2])

  local data = redis.call('HGETALL', key)

  local tokens = max_tokens
  local last_refill = now

  if #data > 0 then
    local fields = {}

    for j = 1, #data, 2 do
      fields[data[j]] = data[j + 1]
    end

    tokens = tonumber(fields['tokens']) or max_tokens
    last_refill = tonumber(fields['last_refill']) or now
  end

  local elapsed = now - last_refill

  tokens = math.min(
    max_tokens,
    tokens + elapsed * refill_rate
  )

  local allowed = tokens >= 1
  local retry_after = 0

  if not allowed then
    retry_after = math.ceil((1 - tokens) / refill_rate)
  end

  buckets[i] = {
    key = key,
    tokens = tokens,
    max_tokens = max_tokens,
    refill_rate = refill_rate,
  }

  if not allowed and failed == nil then
    failed = {
      key,
      math.floor(tokens),
      max_tokens,
      retry_after,
    }
  end
end

-- At least one bucket rejected the request
if failed ~= nil then
  return {
    0,
    failed[1],
    failed[2],
    failed[3],
    failed[4],
  }
end

-- All buckets are allowed: consume one token from each
for i = 1, count do
  local bucket = buckets[i]
  local tokens = bucket.tokens - 1

  redis.call(
    'HSET',
    bucket.key,
    'tokens', tostring(tokens),
    'last_refill', tostring(now)
  )

  redis.call(
    'EXPIRE',
    bucket.key,
    math.ceil(bucket.max_tokens / bucket.refill_rate) + 1
  )
end

return {
  1,
  math.floor(buckets[1].tokens - 1)
}