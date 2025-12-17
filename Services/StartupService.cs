using Microsoft.Win32;

namespace superpc.Services
{
    public class StartupService
    {
        private readonly string _appName = "SuperPC System Monitor Client - https://ovfteam.com/";
        private readonly string _executablePath;

        public StartupService()
        {
            _executablePath = Environment.ProcessPath ?? throw new InvalidOperationException("Cannot get executable path");
        }

        public bool IsStartupEnabled()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", false);
                if (key != null)
                {
                    var value = key.GetValue(_appName) as string;
                    return !string.IsNullOrEmpty(value) && value.Contains(_executablePath);
                }
            }
            catch
            {
                // con-meo-bu
            }

            return false;
        }

        public bool EnableStartup()
        {
            try
            {
                return CreateRegistryKey();
            }
            catch
            {
                return false;
            }
        }

        private bool CreateRegistryKey()
        {
            try
            {
                using var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Run", true);
                if (key != null)
                {
                    key.SetValue(_appName, $"\"{_executablePath}\"");
                    return true;
                }
                return false;
            }
            catch
            {
                return false;
            }
        }

    }
}