using System.Text.Json.Serialization;

namespace FibBun.Api.Models;

public class PiResponse
{
    [JsonPropertyName("digits")]
    public int Digits { get; set; }

    [JsonPropertyName("pi")]
    public string Pi { get; set; } = string.Empty;
}
