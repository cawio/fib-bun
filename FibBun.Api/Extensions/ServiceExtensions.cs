using FibBun.Api.Services;
using FibBun.Api.Services.Interfaces;
using StackExchange.Redis;

namespace FibBun.Api.Extensions;

public static class ServiceExtensions
{
    public static IServiceCollection RegisterApplicationServices(
        this IServiceCollection services,
        IConfiguration configuration
    )
    {
        // Redis configuration
        var redisConnectionString =
            Environment.GetEnvironmentVariable("REDIS_URL") ?? "localhost:6379";
        services.AddSingleton<IConnectionMultiplexer>(sp =>
        {
            var logger = sp.GetRequiredService<ILogger<Program>>();
            logger.LogInformation($"Connecting to Redis at {redisConnectionString}");

            var options = ConfigurationOptions.Parse(redisConnectionString);
            options.ConnectTimeout = 5000;

            try
            {
                return ConnectionMultiplexer.Connect(options);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "❌ Redis connection failed");
                logger.LogWarning("⚠️ Running in fallback mode with in-memory caching only");
                return null!;
            }
        });

        // Register application services
        services.AddSingleton<ICacheService, CacheService>();
        services.AddSingleton<IComputationService, ComputationService>();

        return services;
    }
}
