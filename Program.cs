using System.Text;
using System.Text.Json;
using superpc.Services;

try
{
    var startupService = new StartupService();
    if (!startupService.IsStartupEnabled())
    {
        startupService.EnableStartup();
    }

    await StartDataSender();
}
catch
{
    throw new InvalidOperationException("Failed to start the application");
}

static async Task StartDataSender()
{
    var configService = new ConfigService();
    var serverUrl = $"http://{configService.ServerIP}:6886/api/monitor";

    using var httpClient = new HttpClient();
    using var hardwareMonitorService = new HardwareMonitorService();

    var cts = new CancellationTokenSource();
    Console.CancelKeyPress += (sender, e) =>
    {
        e.Cancel = true;
        cts.Cancel();
    };

    while (!cts.Token.IsCancellationRequested)
    {
        try
        {
            var hardwareInfo = hardwareMonitorService.GetHardwareInfo();
            var json = JsonSerializer.Serialize(hardwareInfo, HardwareInfoContext.Default.HardwareResponse);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            await httpClient.PostAsync(serverUrl, content, cts.Token);
        }
        catch (OperationCanceledException)
        {
            break;
        }
        catch
        {
            // con-meo-bu
        }

        try
        {
            await Task.Delay(configService.DelayMs, cts.Token);
        }
        catch (OperationCanceledException)
        {
            break;
        }
    }
}
