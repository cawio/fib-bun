using System.Text.Json.Serialization;

namespace FibBun.Api.Models;

public class FactorialResponse
{
    [JsonPropertyName("n")]
    public int N { get; set; }

    [JsonPropertyName("factorial")]
    public string Factorial { get; set; } = string.Empty;
}
