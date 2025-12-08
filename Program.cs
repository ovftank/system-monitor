using sppc.Services;

try
{
    var startupService = new StartupService();
    if (!startupService.IsStartupEnabled())
    {
        startupService.EnableStartup();
    }

    await StartHttpServer(args);
}
catch
{
    throw new InvalidOperationException("Failed to start the application");
}

static async Task StartHttpServer(string[] args)
{
    var builder = WebApplication.CreateBuilder(args);

    builder.WebHost.ConfigureKestrel(options =>
    {
        options.Listen(System.Net.IPAddress.Any, 6886);
    });

    builder.Services.AddSingleton<HardwareMonitorService>();

    var app = builder.Build();

    if (app.Environment.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }
    app.UseRouting();

    app.MapGet("/", (HardwareMonitorService hardwareMonitorService) =>
    {
        try
        {
            var hardwareInfo = hardwareMonitorService.GetHardwareInfo();
            return Results.Json(hardwareInfo, HardwareInfoContext.Default.HardwareResponse);
        }
        catch (Exception ex)
        {
            return Results.Problem(detail: ex.ToString(), statusCode: 500);
        }
    });

    try
    {
        await app.RunAsync();
    }
    catch
    {
        throw new InvalidOperationException("HTTP server encountered a fatal error");
    }
}
