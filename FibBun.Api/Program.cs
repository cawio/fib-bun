using FibBun.Api.Extensions;

var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();
builder.Services.AddOutputCache();

// Register application services
builder.Services.RegisterApplicationServices(builder.Configuration);

// Register OpenTelemetry
builder.Services.AddTelemetry(builder.Configuration);

var app = builder.Build();

// Configure middleware
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHealthChecks("/health");
app.UseOutputCache();

// Register API endpoints
app.RegisterApiEndpoints();

// Global error handler
app.Use(
    async (context, next) =>
    {
        try
        {
            await next();
        }
        catch (Exception ex)
        {
            var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
            logger.LogError(ex, "Error processing request");

            context.Response.StatusCode = 500;
            context.Response.ContentType = "application/json";
            await context.Response.WriteAsJsonAsync(
                new { error = $"Internal server error: {ex.Message}" }
            );
        }
    }
);

app.Run();
