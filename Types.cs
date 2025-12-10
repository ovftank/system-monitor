using System.Text.Json;
using System.Text.Json.Serialization;

namespace SystemMonitorServer;

public record ClientInfo
{
    public Dictionary<string, JsonElement> Data { get; init; } = null!;
    public DateTime LastUpdated { get; init; }
    public string ClientId { get; init; } = string.Empty;
}

public record EmptyResponse
{
    public string Message { get; init; } = string.Empty;
}

public record ClientData
{
    public string ClientId { get; init; } = string.Empty;
    public Dictionary<string, JsonElement> Data { get; init; } = null!;
}

public record MonitorResponse
{
    public int TotalClients { get; init; }
    public List<ClientData> Clients { get; init; } = null!;
}

[JsonSerializable(typeof(Dictionary<string, JsonElement>))]
[JsonSerializable(typeof(EmptyResponse))]
[JsonSerializable(typeof(ClientData))]
[JsonSerializable(typeof(MonitorResponse))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}