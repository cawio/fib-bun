using System.Text.Json.Serialization;

namespace FibBun.Api.Models;

public class ErrorResponse
{
    [JsonPropertyName("error")]
    public string Error { get; set; } = string.Empty;
}
