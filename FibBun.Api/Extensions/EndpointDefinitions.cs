using System.Diagnostics;
using FibBun.Api.Models;
using FibBun.Api.Services.Interfaces;
using StackExchange.Redis;

namespace FibBun.Api.Extensions;

public static class EndpointDefinitions
{
    public static void RegisterApiEndpoints(this WebApplication app)
    {
        app.MapGet(
                "/fibonacci/{n:int}",
                async (int n, IComputationService computationService) =>
                {
                    if (n < 0 || n > 1000)
                    {
                        return Results.BadRequest(
                            new { error = "Invalid Fibonacci input (max 1000)" }
                        );
                    }

                    var result = await computationService.GetFibonacciAsync(n);
                    return Results.Ok(new FibonacciResponse { N = n, Fibonacci = result });
                }
            )
            .CacheOutput(c => c.Cache().Expire(TimeSpan.FromMinutes(1)));

        app.MapGet(
                "/prime/{n:int}",
                async (int n, IComputationService computationService) =>
                {
                    if (n <= 0 || n > 10000)
                    {
                        return Results.BadRequest(
                            new { error = "Invalid prime input (max 10000)" }
                        );
                    }

                    var result = await computationService.GetNthPrimeAsync(n);
                    return Results.Ok(new PrimeResponse { N = n, Prime = result });
                }
            )
            .CacheOutput(c => c.Cache().Expire(TimeSpan.FromMinutes(1)));

        app.MapGet(
                "/factorial/{n:int}",
                async (int n, IComputationService computationService) =>
                {
                    if (n < 0 || n > 170)
                    {
                        return Results.BadRequest(
                            new { error = "Invalid factorial input (max 170)" }
                        );
                    }

                    var result = await computationService.GetFactorialAsync(n);
                    return Results.Ok(new FactorialResponse { N = n, Factorial = result });
                }
            )
            .CacheOutput(c => c.Cache().Expire(TimeSpan.FromMinutes(1)));

        app.MapGet(
                "/pi/{digits:int}",
                async (int digits, IComputationService computationService) =>
                {
                    if (digits < 1 || digits > 50)
                    {
                        return Results.BadRequest(
                            new { error = "Invalid Pi digit input (max 50)" }
                        );
                    }

                    var result = await computationService.GetPiAsync(digits);
                    return Results.Ok(new PiResponse { Digits = digits, Pi = result });
                }
            )
            .CacheOutput(c => c.Cache().Expire(TimeSpan.FromMinutes(1)));

        app.MapGet(
            "/random-bytes/{size:int}",
            (int size, IComputationService computationService) =>
            {
                if (size < 1 || size > 5000)
                {
                    return Results.BadRequest(new { error = "Invalid byte size (max 5000)" });
                }

                return Results.Ok(
                    new RandomBytesResponse
                    {
                        Size = size,
                        Data = computationService.GenerateRandomBytes(size)
                    }
                );
            }
        );

        app.MapGet(
            "/sort/{size:int}",
            (int size, IComputationService computationService) =>
            {
                if (size < 1 || size > 5000)
                {
                    return Results.BadRequest(new { error = "Invalid sort size (max 5000)" });
                }

                return Results.Ok(
                    new SortResponse
                    {
                        Size = size,
                        Sorted = computationService.GenerateAndSortArray(size)
                    }
                );
            }
        );
    }
}
