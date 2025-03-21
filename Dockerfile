# Build stage
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution and project files first for better layer caching
COPY ["FibBun.sln", "./"]
COPY ["FibBun.Api/FibBun.Api.csproj", "FibBun.Api/"]

# Restore dependencies
RUN dotnet restore "FibBun.Api/FibBun.Api.csproj"

# Copy all source files
COPY . .

# Build and publish
WORKDIR "/src/FibBun.Api"
# Run restore again within the project directory just to be safe
RUN dotnet restore
# Publish without the --no-restore flag to ensure dependencies are available
RUN dotnet publish "FibBun.Api.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app

# Copy published app from build stage
COPY --from=build /app/publish .

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=true
ENV Telemetry__OtlpGrpcEndpoint=http://+:18889
ENV Telemetry__OtlpHttpEndpoint=http://+:18890

# Command to run the application
ENTRYPOINT ["dotnet", "FibBun.Api.dll"]