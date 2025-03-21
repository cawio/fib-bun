using System;
using System.Collections.Concurrent;
using FibBun.Api.Services.Interfaces;
using StackExchange.Redis;

namespace FibBun.Api.Services;

public class CacheService(ILogger<CacheService> logger, IConnectionMultiplexer? redis)
    : ICacheService
{
    private readonly ILogger<CacheService> _logger = logger;
    private readonly IConnectionMultiplexer? _redis = redis;

    // Redis key prefixes
    private static class RedisKeys
    {
        public const string Fibonacci = "fib:";
        public const string Prime = "prime:";
        public const string Factorial = "fact:";
        public const string Pi = "pi:";
        public const string Healthcheck = "health:";
    }

    // Fallback caches
    private readonly ConcurrentDictionary<int, string> _fibCache = new();
    private readonly ConcurrentDictionary<int, string> _primeCache = new();
    private readonly ConcurrentDictionary<int, string> _factorialCache = new();
    private readonly ConcurrentDictionary<int, string> _piCache = new();

    // Default TTL for Redis cache (1 week in seconds)
    private const int DefaultTtl = 604800;

    public async Task<string?> GetValueAsync(string key)
    {
        // Extract cache type from key
        var keyParts = key.Split(':');
        if (keyParts.Length < 2)
            return null;

        var keyType = keyParts[0] + ":";
        ConcurrentDictionary<int, string>? fallbackCache = null;

        // Select appropriate fallback cache
        switch (keyType)
        {
            case RedisKeys.Fibonacci:
                fallbackCache = _fibCache;
                break;
            case RedisKeys.Prime:
                fallbackCache = _primeCache;
                break;
            case RedisKeys.Factorial:
                fallbackCache = _factorialCache;
                break;
            case RedisKeys.Pi:
                fallbackCache = _piCache;
                break;
        }

        try
        {
            // Try Redis first if connected
            if (_redis != null && _redis.IsConnected)
            {
                var db = _redis.GetDatabase();
                var value = await db.StringGetAsync(key);

                if (value.HasValue)
                {
                    return value;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Redis error when getting {key}");
        }

        // Fallback to in-memory cache if Redis fails or value not found
        if (fallbackCache != null && int.TryParse(keyParts[1], out var numericKey))
        {
            if (fallbackCache.TryGetValue(numericKey, out var value))
            {
                return value;
            }
        }

        return null;
    }

    public async Task SetValueAsync(string key, string value, int ttl = DefaultTtl)
    {
        // Extract cache type from key
        var keyParts = key.Split(':');
        if (keyParts.Length < 2)
            return;

        var keyType = keyParts[0] + ":";
        ConcurrentDictionary<int, string>? fallbackCache = null;

        // Select appropriate fallback cache
        switch (keyType)
        {
            case RedisKeys.Fibonacci:
                fallbackCache = _fibCache;
                break;
            case RedisKeys.Prime:
                fallbackCache = _primeCache;
                break;
            case RedisKeys.Factorial:
                fallbackCache = _factorialCache;
                break;
            case RedisKeys.Pi:
                fallbackCache = _piCache;
                break;
        }

        try
        {
            // Store in Redis if connected
            if (_redis != null && _redis.IsConnected)
            {
                var db = _redis.GetDatabase();
                await db.StringSetAsync(key, value, TimeSpan.FromSeconds(ttl));
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, $"Redis error when setting {key}");
        }

        // Always update local cache as fallback
        if (fallbackCache != null && int.TryParse(keyParts[1], out var numericKey))
        {
            fallbackCache[numericKey] = value;
        }
    }
}
