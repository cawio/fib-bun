using System.Text.Json.Serialization;

namespace FibBun.Api.Models;

public class HealthCheckResponse
{
    [JsonPropertyName("status")]
    public string Status { get; set; } = string.Empty;

    [JsonPropertyName("timestamp")]
    public string Timestamp { get; set; } = string.Empty;

    [JsonPropertyName("redis")]
    public string Redis { get; set; } = string.Empty;

    [JsonPropertyName("uptime")]
    public double Uptime { get; set; }

    [JsonPropertyName("memoryUsage")]
    public object MemoryUsage { get; set; } = new();
}
