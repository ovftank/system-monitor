namespace superpc.Services
{
    public class ConfigService
    {
        public string ServerIP { get; private set; } = "127.0.0.1";
        public int DelayMs { get; private set; } = 1000;

        public ConfigService()
        {
            var configPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "config.ini");

            try
            {
                if (!File.Exists(configPath))
                {
                    CreateDefaultConfig(configPath);
                    return;
                }

                var lines = File.ReadAllLines(configPath);
                var validLines = lines.Where(l => !string.IsNullOrWhiteSpace(l.Trim()) && !l.Trim().StartsWith('#') && !l.Trim().StartsWith(';')).ToList();

                if (validLines.Count == 0)
                {
                    CreateDefaultConfig(configPath);
                    return;
                }

                if (validLines.Count > 0 && !string.IsNullOrWhiteSpace(validLines[0]))
                    ServerIP = validLines[0].Trim();

                if (validLines.Count > 1 && int.TryParse(validLines[1].Trim(), out var delay) && delay > 0)
                    DelayMs = delay;
                else
                    DelayMs = 1000;
            }
            catch
            {
                CreateDefaultConfig(configPath);
            }
        }

        private void CreateDefaultConfig(string configPath)
        {
            try
            {
                var defaultContent = $"# SuperPC System Monitor\n# ip server\n{ServerIP}\n# delay (ms)\n1000\n";
                File.WriteAllText(configPath, defaultContent);
            }
            catch
            {
                // con-meo-bu
            }
        }
    }
}