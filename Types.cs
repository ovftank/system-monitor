using System.Text.Json.Serialization;

namespace SystemMonitorServer;

public record HardwareResponse
{
    public string HostName { get; init; } = Environment.MachineName;
    public string LocalIP { get; init; } = "";
    public long Timestamp { get; init; }
    public List<HardwareInfo> Hardware { get; init; } = [];
}

public record HardwareInfo
{
    public string Name { get; init; } = string.Empty;
    public string HardwareType { get; init; } = string.Empty;
    public List<SensorInfo> Sensors { get; init; } = [];
}

public record SensorInfo
{
    public string Name { get; init; } = string.Empty;
    public string SensorType { get; init; } = string.Empty;
    public double Value { get; init; }
    public string Unit { get; init; } = string.Empty;
}

public record ClientInfo
{
    public HardwareResponse Data { get; init; } = null!;
    public DateTime LastUpdated { get; init; }
    public string ClientId { get; init; } = string.Empty;
}

public record ClientData
{
    public string ClientId { get; init; } = string.Empty;
    public HardwareResponse Data { get; init; } = null!;
    public DateTime LastUpdated { get; init; }
}

public record MonitorResponse
{
    public int TotalClients { get; init; }
    public List<ClientData> Clients { get; init; } = null!;
}

[JsonSerializable(typeof(HardwareResponse))]
[JsonSerializable(typeof(HardwareInfo))]
[JsonSerializable(typeof(SensorInfo))]
[JsonSerializable(typeof(List<HardwareInfo>))]
[JsonSerializable(typeof(List<SensorInfo>))]
[JsonSerializable(typeof(ClientInfo))]
[JsonSerializable(typeof(ClientData))]
[JsonSerializable(typeof(MonitorResponse))]
[JsonSerializable(typeof(List<ClientData>))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}