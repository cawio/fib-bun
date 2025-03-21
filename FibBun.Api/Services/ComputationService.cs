using System.Numerics;
using System.Security.Cryptography;
using FibBun.Api.Services.Interfaces;

namespace FibBun.Api.Services;

public class ComputationService(ILogger<ComputationService> logger, ICacheService cacheService)
    : IComputationService
{
    private readonly ILogger<ComputationService> _logger = logger;
    private readonly ICacheService _cacheService = cacheService;

    // Redis key prefixes
    private static class RedisKeys
    {
        public const string Fibonacci = "fib:";
        public const string Prime = "prime:";
        public const string Factorial = "fact:";
        public const string Pi = "pi:";
    }

    public async Task<string> GetFibonacciAsync(int n)
    {
        if (n <= 0)
            return "0";
        if (n == 1)
            return "1";

        var cacheKey = $"{RedisKeys.Fibonacci}{n}";
        var cachedValue = await _cacheService.GetValueAsync(cacheKey);

        if (cachedValue != null)
        {
            return cachedValue;
        }

        BigInteger a = BigInteger.Zero;
        BigInteger b = BigInteger.One;

        for (int i = 2; i <= n; i++)
        {
            var temp = a + b;
            a = b;
            b = temp;

            // Cache intermediate results periodically
            if (i % 10 == 0 || i == n)
            {
                await _cacheService.SetValueAsync($"{RedisKeys.Fibonacci}{i}", b.ToString());
            }
        }

        return b.ToString();
    }

    public BigInteger CalculateFibonacci(int n)
    {
        if (n <= 0)
            return BigInteger.Zero;
        if (n == 1)
            return BigInteger.One;

        BigInteger a = BigInteger.Zero;
        BigInteger b = BigInteger.One;

        for (int i = 2; i <= n; i++)
        {
            var temp = a + b;
            a = b;
            b = temp;
        }

        return b;
    }

    public Task<List<int>> ComputeInitialPrimesAsync(int maxN)
    {
        var primes = new List<int>();
        var sieve = new bool[maxN * 20];

        // Initialize sieve - true means potentially prime
        for (int i = 2; i < sieve.Length; i++)
        {
            sieve[i] = true;
        }

        for (int i = 2; primes.Count < maxN && i < sieve.Length; i++)
        {
            if (sieve[i])
            {
                primes.Add(i);

                // Mark all multiples as non-prime
                for (long j = (long)i * i; j < sieve.Length; j += i)
                {
                    if (j < sieve.Length)
                        sieve[j] = false;
                }
            }
        }

        return Task.FromResult(primes);
    }

    public async Task<string> GetNthPrimeAsync(int n)
    {
        if (n <= 0)
            return "0";

        var cacheKey = $"{RedisKeys.Prime}{n}";
        var cachedValue = await _cacheService.GetValueAsync(cacheKey);

        if (cachedValue != null)
        {
            return cachedValue;
        }

        // Compute using sieve for efficiency
        var primes = await ComputeInitialPrimesAsync(Math.Max(n, 100));

        if (n <= primes.Count)
        {
            var result = primes[n - 1].ToString();
            await _cacheService.SetValueAsync(cacheKey, result);
            return result;
        }

        // For very large n, we would need a more sophisticated approach
        _logger.LogWarning($"Prime calculation for n={n} exceeds efficient calculation limit");
        return "0"; // Should be replaced with actual computation
    }

    public BigInteger CalculateFactorial(int n)
    {
        if (n <= 1)
            return BigInteger.One;

        BigInteger result = BigInteger.One;
        for (int i = 2; i <= n; i++)
        {
            result *= i;
        }

        return result;
    }

    public async Task<string> GetFactorialAsync(int n)
    {
        if (n <= 1)
            return "1";

        var cacheKey = $"{RedisKeys.Factorial}{n}";
        var cachedValue = await _cacheService.GetValueAsync(cacheKey);

        if (cachedValue != null)
        {
            return cachedValue;
        }

        // Find largest cached factorial less than n
        BigInteger result = BigInteger.One;
        int start = 1;

        for (int i = n - 1; i >= 1; i--)
        {
            var prevCacheKey = $"{RedisKeys.Factorial}{i}";
            var prevCached = await _cacheService.GetValueAsync(prevCacheKey);

            if (prevCached != null)
            {
                result = BigInteger.Parse(prevCached);
                start = i + 1;
                break;
            }
        }

        // Calculate remaining part
        for (int i = start; i <= n; i++)
        {
            result *= i;

            // Cache intermediate results
            if (i % 5 == 0 || i == n)
            {
                await _cacheService.SetValueAsync($"{RedisKeys.Factorial}{i}", result.ToString());
            }
        }

        return result.ToString();
    }

    public string ComputePi(int digits)
    {
        // A simplified method for Pi calculation - in production, use a more sophisticated algorithm
        // This approximation is based on the Nilakantha series
        double pi = 3.0;
        int iterations = Math.Min(10000, digits * 10);
        double sign = 1.0;

        for (int i = 2; i <= iterations * 2; i += 2)
        {
            pi += sign * 4.0 / (i * (i + 1) * (i + 2));
            sign = -sign;
        }

        return pi.ToString($"F{digits}");
    }

    public async Task<string> GetPiAsync(int digits)
    {
        var cacheKey = $"{RedisKeys.Pi}{digits}";
        var cachedValue = await _cacheService.GetValueAsync(cacheKey);

        if (cachedValue != null)
        {
            return cachedValue;
        }

        var result = ComputePi(digits);
        await _cacheService.SetValueAsync(cacheKey, result);

        return result;
    }

    public string GenerateRandomBytes(int size)
    {
        // Limit size to prevent excessive memory usage
        int actualSize = Math.Min(size, 5000);
        var buffer = new byte[actualSize];
        RandomNumberGenerator.Fill(buffer);
        return Convert.ToHexString(buffer).ToLower();
    }

    public double[] GenerateAndSortArray(int size)
    {
        // Limit size to prevent excessive memory usage
        int actualSize = Math.Min(size, 5000);
        var rng = new Random();
        var arr = new double[actualSize];

        for (int i = 0; i < actualSize; i++)
        {
            arr[i] = rng.NextDouble();
        }
        Array.Sort(arr);
        return arr;
    }
}
