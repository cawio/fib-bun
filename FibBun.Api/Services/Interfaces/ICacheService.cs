namespace FibBun.Api.Services.Interfaces;

public interface ICacheService
{
    /// <summary>
    /// Gets a cached value by key
    /// </summary>
    /// <param name="key">The cache key</param>
    /// <returns>The cached value, or null if not found</returns>
    Task<string?> GetValueAsync(string key);

    /// <summary>
    /// Caches a value with the specified key
    /// </summary>
    /// <param name="key">The cache key</param>
    /// <param name="value">The value to cache</param>
    /// <param name="ttl">Optional time-to-live in seconds</param>
    Task SetValueAsync(string key, string value, int ttl = 604800);
}
