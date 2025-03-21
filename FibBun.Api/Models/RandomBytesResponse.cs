using System.Text.Json.Serialization;

namespace FibBun.Api.Models;

public class RandomBytesResponse
{
    [JsonPropertyName("size")]
    public int Size { get; set; }

    [JsonPropertyName("data")]
    public string Data { get; set; } = string.Empty;
}
