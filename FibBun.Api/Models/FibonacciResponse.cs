using System.Text.Json.Serialization;

namespace FibBun.Api.Models;

public class FibonacciResponse
{
    [JsonPropertyName("n")]
    public int N { get; set; }

    [JsonPropertyName("fibonacci")]
    public string Fibonacci { get; set; } = string.Empty;
}
