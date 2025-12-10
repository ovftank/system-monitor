using System.Collections.Concurrent;
using System.Text.Json;
using SystemMonitorServer;

try
{
    var startupService = new StartupService();
    if (!startupService.IsStartupEnabled())
    {
        startupService.EnableStartup();
    }
}
catch
{
    // con-meo-bu
}

var builder = WebApplication.CreateSlimBuilder(args);

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default);
});

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 50 * 1024 * 1024;
    options.Limits.MaxRequestBufferSize = 50 * 1024 * 1024;
    options.Limits.MaxRequestHeadersTotalSize = 1024 * 1024;
    options.Limits.MaxRequestHeaderCount = 100;
    options.Limits.Http2.MaxRequestHeaderFieldSize = 1024 * 1024;
    options.Limits.Http2.MaxFrameSize = 1024 * 1024;
    options.Limits.Http3.MaxRequestHeaderFieldSize = 1024 * 1024;
    options.Limits.RequestHeadersTimeout = TimeSpan.FromMinutes(2);
    options.Limits.KeepAliveTimeout = TimeSpan.FromMinutes(5);
});

var app = builder.Build();

var clientsData = new ConcurrentDictionary<string, ClientInfo>();

app.MapPost("/api/monitor", (Dictionary<string, JsonElement>? data) =>
{
    if (data is null)
    {
        return Results.StatusCode(400);
    }

    try
    {
        var clientId = GenerateClientId(data);

        var clientInfo = new ClientInfo
        {
            Data = data,
            LastUpdated = DateTime.Now,
            ClientId = clientId
        };

        clientsData.AddOrUpdate(clientId, clientInfo, (_, _) => clientInfo);

        return Results.StatusCode(200);
    }
    catch
    {
        return Results.StatusCode(500);
    }
});

static string GenerateClientId(Dictionary<string, JsonElement> data)
{
    data.TryGetValue("LocalIP", out var localIpObj);
    data.TryGetValue("HostName", out var hostnameObj);

    var hostname = hostnameObj.ValueKind == JsonValueKind.Undefined ? "unknown" : hostnameObj.GetString() ?? "unknown";
    var localIp = localIpObj.ValueKind == JsonValueKind.Undefined ? null : localIpObj.GetString();

    return localIp != null ? $"{hostname}_{localIp}" : hostname;
}

app.MapGet("/api/monitor", () =>
{
    try
    {
        var clientDataList = new List<ClientData>();
        foreach (var clientInfo in clientsData.Values)
        {
            clientDataList.Add(new ClientData
            {
                ClientId = clientInfo.ClientId,
                Data = clientInfo.Data
            });
        }

        var response = new MonitorResponse
        {
            TotalClients = clientDataList.Count,
            Clients = clientDataList
        };

        return Results.Json(response, AppJsonSerializerContext.Default.MonitorResponse);
    }
    catch
    {
        return Results.StatusCode(500);
    }
});

await app.RunAsync("http://0.0.0.0:6886");