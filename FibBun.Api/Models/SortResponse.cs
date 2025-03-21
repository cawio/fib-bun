using System.Text.Json.Serialization;

namespace FibBun.Api.Models;

public class SortResponse
{
    [JsonPropertyName("size")]
    public int Size { get; set; }

    [JsonPropertyName("sorted")]
    public double[] Sorted { get; set; } = Array.Empty<double>();
}
