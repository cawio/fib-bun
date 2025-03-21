using System.Numerics;

namespace FibBun.Api.Services.Interfaces;

public interface IComputationService
{
    /// <summary>
    /// Calculates the nth Fibonacci number
    /// </summary>
    /// <param name="n">The position in the Fibonacci sequence</param>
    /// <returns>The nth Fibonacci number as a string</returns>
    Task<string> GetFibonacciAsync(int n);

    /// <summary>
    /// Calculates the nth prime number
    /// </summary>
    /// <param name="n">The position in the sequence of prime numbers</param>
    /// <returns>The nth prime number as a string</returns>
    Task<string> GetNthPrimeAsync(int n);

    /// <summary>
    /// Calculates the factorial of n
    /// </summary>
    /// <param name="n">The number to calculate factorial for</param>
    /// <returns>The factorial of n as a string</returns>
    Task<string> GetFactorialAsync(int n);

    /// <summary>
    /// Calculates Pi to the specified number of digits
    /// </summary>
    /// <param name="digits">The number of decimal digits</param>
    /// <returns>Pi as a string with the specified precision</returns>
    Task<string> GetPiAsync(int digits);

    /// <summary>
    /// Generates random bytes
    /// </summary>
    /// <param name="size">The number of bytes to generate</param>
    /// <returns>The random bytes as a hex string</returns>
    string GenerateRandomBytes(int size);

    /// <summary>
    /// Generates and sorts an array of random numbers
    /// </summary>
    /// <param name="size">The size of the array</param>
    /// <returns>The sorted array</returns>
    double[] GenerateAndSortArray(int size);

    /// <summary>
    /// Synchronous calculation of the nth Fibonacci number
    /// </summary>
    /// <param name="n">The position in the Fibonacci sequence</param>
    /// <returns>The nth Fibonacci number</returns>
    BigInteger CalculateFibonacci(int n);

    /// <summary>
    /// Synchronous calculation of n factorial
    /// </summary>
    /// <param name="n">The number to calculate factorial for</param>
    /// <returns>The factorial of n</returns>
    BigInteger CalculateFactorial(int n);

    /// <summary>
    /// Computes Pi to the specified number of digits
    /// </summary>
    /// <param name="digits">The number of decimal digits</param>
    /// <returns>Pi as a string with the specified precision</returns>
    string ComputePi(int digits);

    /// <summary>
    /// Computes a list of prime numbers up to a maximum n
    /// </summary>
    /// <param name="maxN">The maximum number of primes to compute</param>
    /// <returns>A list of prime numbers</returns>
    Task<List<int>> ComputeInitialPrimesAsync(int maxN);
}
