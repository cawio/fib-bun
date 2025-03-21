using System.Text.Json.Serialization;

namespace FibBun.Api.Models;

public class PrimeResponse
{
    [JsonPropertyName("n")]
    public int N { get; set; }

    [JsonPropertyName("prime")]
    public string Prime { get; set; } = string.Empty;
}
