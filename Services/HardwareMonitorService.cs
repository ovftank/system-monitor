using System.Diagnostics;
using System.Net;
using System.Net.NetworkInformation;
using System.Net.Sockets;
using System.Text.Json.Serialization;
using LibreHardwareMonitor.Hardware;

namespace superpc.Services
{
    public class HardwareMonitorService : IDisposable
    {
        private readonly Computer _computer;
        private bool _disposed = false;
        private bool? _vtCachedStatus = null;
        private static readonly string _cachedHostName = GetHostName();
        private static readonly string _cachedLocalIP = GetLanIP();

        public HardwareMonitorService()
        {
            _computer = new Computer
            {
                IsCpuEnabled = true,
                IsGpuEnabled = true,
                IsMemoryEnabled = true,
                IsMotherboardEnabled = true,
                IsControllerEnabled = false,
                IsNetworkEnabled = true,
                IsStorageEnabled = false,
                IsBatteryEnabled = false,
                IsPsuEnabled = false
            };

            _computer.Open();
        }

        public HardwareResponse GetHardwareInfo()
        {
            ObjectDisposedException.ThrowIf(_disposed, typeof(HardwareMonitorService));
            var hardwareInfoList = new List<HardwareInfo>();
            _computer.Accept(new UpdateVisitor());

            foreach (IHardware hardware in _computer.Hardware)
            {
                if (hardware.HardwareType == HardwareType.Network && !IsPhysicalNetworkAdapter(hardware))
                {
                    continue;
                }

                var hardwareInfo = CreateHardwareInfo(hardware);
                hardwareInfoList.Add(hardwareInfo);
            }

            return new HardwareResponse
            {
                HostName = _cachedHostName,
                LocalIP = _cachedLocalIP,
                Timestamp = DateTimeOffset.UtcNow.ToUnixTimeSeconds(),
                Hardware = hardwareInfoList
            };
        }

        private HardwareInfo CreateHardwareInfo(IHardware hardware)
        {
            var hardwareInfo = new HardwareInfo
            {
                Name = hardware.Name,
                HardwareType = hardware.HardwareType.ToString(),
                Sensors = []
            };

            if (hardware.HardwareType == HardwareType.Cpu)
            {
                AddAveragedCpuSensors(hardwareInfo, hardware.Sensors);
                AddVTStatusIfNeeded(hardwareInfo, hardware);
            }
            else if (hardware.HardwareType == HardwareType.GpuNvidia ||
                     hardware.HardwareType == HardwareType.GpuAmd ||
                     hardware.HardwareType == HardwareType.GpuIntel)
            {
                AddAveragedGpuSensors(hardwareInfo, hardware.Sensors);
            }
            else if (hardware.HardwareType == HardwareType.Memory)
            {
                AddMemorySensors(hardwareInfo, hardware.Sensors);
            }
            else if (hardware.HardwareType == HardwareType.Network)
            {
                AddNetworkSensors(hardwareInfo, hardware.Sensors);
            }
            else
            {
                AddSensors(hardwareInfo, hardware.Sensors);
            }

            AddMemorySpeedIfNeeded(hardwareInfo, hardware);
            AddNetworkSpeedIfNeeded(hardwareInfo, hardware);
            AddSubHardwareSensors(hardwareInfo, hardware.SubHardware);

            return hardwareInfo;
        }

        private static void AddAveragedCpuSensors(HardwareInfo hardwareInfo, IEnumerable<ISensor> sensors)
        {
            var sensorsList = sensors.ToList();

            var loads = sensorsList
                .Where(s => s.SensorType == SensorType.Load && s.Value.HasValue && s.Name.Contains("CPU Total", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.Value!.Value)
                .ToList();

            if (loads.Count > 0)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "CPU Usage",
                    SensorType = "Load",
                    Value = Math.Round(loads.Average(), 2),
                    Unit = "%"
                });
            }

            var temps = sensorsList
                .Where(s => s.SensorType == SensorType.Temperature && s.Value.HasValue &&
                           (s.Name.Contains("Core Average", StringComparison.OrdinalIgnoreCase) ||
                            s.Name.Contains("CPU Package", StringComparison.OrdinalIgnoreCase)))
                .Select(s => s.Value!.Value)
                .ToList();

            if (temps.Count > 0)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "CPU Temperature",
                    SensorType = "Temperature",
                    Value = Math.Round(temps.Average(), 2),
                    Unit = "°C"
                });
            }

            var clocks = sensorsList
                .Where(s => s.SensorType == SensorType.Clock && s.Value.HasValue &&
                           !s.Name.Contains("Bus Speed", StringComparison.OrdinalIgnoreCase) &&
                           s.Name.Contains("CPU Core", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.Value!.Value)
                .ToList();

            if (clocks.Count > 0)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "CPU Clock",
                    SensorType = "Clock",
                    Value = Math.Round(clocks.Average(), 2),
                    Unit = "MHz"
                });
            }

            var powers = sensorsList
                .Where(s => s.SensorType == SensorType.Power && s.Value.HasValue &&
                           s.Name.Contains("CPU Package", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.Value!.Value)
                .ToList();

            if (powers.Count > 0)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "CPU Power",
                    SensorType = "Power",
                    Value = Math.Round(powers[0], 2),
                    Unit = "W"
                });
            }
        }

        private static void AddAveragedGpuSensors(HardwareInfo hardwareInfo, IEnumerable<ISensor> sensors)
        {
            var sensorsList = sensors.ToList();

            var loads = sensorsList
                .Where(s => s.SensorType == SensorType.Load && s.Value.HasValue &&
                           (s.Name.Contains("GPU Core", StringComparison.OrdinalIgnoreCase) ||
                            s.Name.Contains("D3D 3D", StringComparison.OrdinalIgnoreCase)))
                .Select(s => s.Value!.Value)
                .ToList();

            if (loads.Count > 0)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "GPU Usage",
                    SensorType = "Load",
                    Value = Math.Round(loads.Average(), 2),
                    Unit = "%"
                });
            }

            var temps = sensorsList
                .Where(s => s.SensorType == SensorType.Temperature && s.Value.HasValue &&
                           s.Name.Contains("GPU Core", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.Value!.Value)
                .ToList();

            if (temps.Count > 0)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "GPU Temperature",
                    SensorType = "Temperature",
                    Value = Math.Round(temps.Average(), 2),
                    Unit = "°C"
                });
            }

            var clocks = sensorsList
                .Where(s => s.SensorType == SensorType.Clock && s.Value.HasValue &&
                           s.Name.Contains("Core", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.Value!.Value)
                .ToList();

            if (clocks.Count > 0)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "GPU Clock",
                    SensorType = "Clock",
                    Value = Math.Round(clocks.Average(), 2),
                    Unit = "MHz"
                });
            }

            var powers = sensorsList
                .Where(s => s.SensorType == SensorType.Power && s.Value.HasValue &&
                           s.Name.Contains("GPU Power", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.Value!.Value)
                .ToList();

            if (powers.Count > 0)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "GPU Power",
                    SensorType = "Power",
                    Value = Math.Round(powers[0], 2),
                    Unit = "W"
                });
            }

            var fans = sensorsList
                .Where(s => s.SensorType == SensorType.Fan && s.Value.HasValue &&
                           s.Name.Contains("GPU Fan", StringComparison.OrdinalIgnoreCase))
                .Select(s => s.Value!.Value)
                .ToList();

            if (fans.Count > 0)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "GPU Fan",
                    SensorType = "Fan",
                    Value = Math.Round(fans[0], 2),
                    Unit = "RPM"
                });
            }
        }

        private static void AddMemorySensors(HardwareInfo hardwareInfo, IEnumerable<ISensor> sensors)
        {
            var sensorsList = sensors.ToList();

            var memoryUsed = sensorsList
                .FirstOrDefault(s => s.SensorType == SensorType.Data &&
                                    s.Name.Equals("Memory Used", StringComparison.OrdinalIgnoreCase));

            if (memoryUsed?.Value.HasValue == true)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "Memory Used",
                    SensorType = "Data",
                    Value = Math.Round(memoryUsed.Value.Value, 2),
                    Unit = "GB"
                });
            }

            var memoryAvailable = sensorsList
                .FirstOrDefault(s => s.SensorType == SensorType.Data &&
                                    s.Name.Equals("Memory Available", StringComparison.OrdinalIgnoreCase));

            if (memoryAvailable?.Value.HasValue == true)
            {
                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "Memory Available",
                    SensorType = "Data",
                    Value = Math.Round(memoryAvailable.Value.Value, 2),
                    Unit = "GB"
                });
            }

            if (memoryUsed?.Value.HasValue == true && memoryAvailable?.Value.HasValue == true)
            {
                var totalMemory = memoryUsed.Value.Value + memoryAvailable.Value.Value;
                var usagePercent = (memoryUsed.Value.Value / totalMemory) * 100;

                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "Memory Usage",
                    SensorType = "Load",
                    Value = Math.Round(usagePercent, 2),
                    Unit = "%"
                });
            }
        }

        private void AddVTStatusIfNeeded(HardwareInfo hardwareInfo, IHardware hardware)
        {
            if (hardware.HardwareType != HardwareType.Cpu) return;

            hardwareInfo.Sensors.Add(new SensorInfo
            {
                Name = "VT-x Enabled",
                SensorType = "Virtualization",
                Value = IsVTEnabled() ? 1 : 0,
                Unit = ""
            });
        }

        private void AddMemorySpeedIfNeeded(HardwareInfo hardwareInfo, IHardware hardware)
        {
            if (hardware.HardwareType != HardwareType.Memory) return;

            try
            {
                if (_computer.SMBios?.MemoryDevices != null)
                {
                    foreach (var memory in _computer.SMBios.MemoryDevices)
                    {
                        var speed = memory.ConfiguredSpeed > 0 ? memory.ConfiguredSpeed : memory.Speed;

                        if (speed > 0)
                        {
                            hardwareInfo.Sensors.Add(new SensorInfo
                            {
                                Name = "Memory Speed",
                                SensorType = "Clock",
                                Value = speed,
                                Unit = "MHz"
                            });
                            return;
                        }
                    }
                }
            }
            catch
            {
                // con-meo-bu
            }
        }

        private static bool IsPhysicalNetworkAdapter(IHardware hardware)
        {
            if (hardware.HardwareType != HardwareType.Network) return false;

            if (hardware.Name.StartsWith("vEthernet", StringComparison.OrdinalIgnoreCase) ||
                hardware.Name.StartsWith("Local Area Connection*", StringComparison.OrdinalIgnoreCase) ||
                hardware.Name.Contains("Bluetooth", StringComparison.OrdinalIgnoreCase) ||
                hardware.Name.Contains("Virtual", StringComparison.OrdinalIgnoreCase) ||
                hardware.Name.Contains("VMware", StringComparison.OrdinalIgnoreCase) ||
                hardware.Name.Contains("VirtualBox", StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            try
            {
                var networkInterface = NetworkInterface.GetAllNetworkInterfaces()
                    .FirstOrDefault(ni => ni.Name.Equals(hardware.Name, StringComparison.OrdinalIgnoreCase));

                return networkInterface?.NetworkInterfaceType == NetworkInterfaceType.Ethernet ||
                       networkInterface?.NetworkInterfaceType == NetworkInterfaceType.Wireless80211;
            }
            catch
            {
                return false;
            }
        }

        private static void AddNetworkSensors(HardwareInfo hardwareInfo, IEnumerable<ISensor> sensors)
        {
            foreach (ISensor sensor in sensors)
            {
                if (!sensor.Value.HasValue) continue;

                if (sensor.SensorType == SensorType.Throughput)
                {
                    hardwareInfo.Sensors.Add(new SensorInfo
                    {
                        Name = sensor.Name,
                        SensorType = sensor.SensorType.ToString(),
                        Value = sensor.Value.Value,
                        Unit = GetUnit(sensor.SensorType)
                    });
                }
            }
        }

        private static void AddNetworkSpeedIfNeeded(HardwareInfo hardwareInfo, IHardware hardware)
        {
            if (hardware.HardwareType != HardwareType.Network) return;

            try
            {
                var networkInterface = NetworkInterface.GetAllNetworkInterfaces()
                    .Where(ni => ni.NetworkInterfaceType == NetworkInterfaceType.Ethernet ||
                                 ni.NetworkInterfaceType == NetworkInterfaceType.Wireless80211)
                    .FirstOrDefault(ni => ni.Name.Equals(hardware.Name, StringComparison.OrdinalIgnoreCase));

                if (networkInterface == null) return;

                var speedMbps = networkInterface.Speed > 0
                    ? networkInterface.Speed / 1_000_000.0
                    : 0;

                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = "Link Speed",
                    SensorType = "Data",
                    Value = speedMbps,
                    Unit = "Mbps"
                });
            }
            catch
            {
                // con-meo-bu
            }
        }

        private static void AddSensors(HardwareInfo hardwareInfo, IEnumerable<ISensor> sensors)
        {
            foreach (ISensor sensor in sensors)
            {
                if (!sensor.Value.HasValue) continue;

                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = sensor.Name,
                    SensorType = sensor.SensorType.ToString(),
                    Value = sensor.Value.Value,
                    Unit = GetUnit(sensor.SensorType)
                });
            }
        }

        private static void AddSensors(HardwareInfo hardwareInfo, IEnumerable<NamedSensor> namedSensors)
        {
            foreach (var namedSensor in namedSensors)
            {
                if (!namedSensor.Sensor.Value.HasValue) continue;

                hardwareInfo.Sensors.Add(new SensorInfo
                {
                    Name = namedSensor.Name,
                    SensorType = namedSensor.Sensor.SensorType.ToString(),
                    Value = namedSensor.Sensor.Value.Value,
                    Unit = GetUnit(namedSensor.Sensor.SensorType)
                });
            }
        }

        private static void AddSubHardwareSensors(HardwareInfo hardwareInfo, IEnumerable<IHardware> subHardwares)
        {
            foreach (IHardware subHardware in subHardwares)
            {
                subHardware.Update();
                AddSensors(hardwareInfo, subHardware.Sensors.Select(s => new NamedSensor
                {
                    Name = $"{subHardware.Name} - {s.Name}",
                    Sensor = s
                }));
            }
        }

        private sealed class NamedSensor
        {
            public string Name { get; set; } = string.Empty;
            public ISensor Sensor { get; set; } = null!;
        }

        private static string GetUnit(SensorType sensorType)
        {
            return sensorType switch
            {
                SensorType.Temperature => "°C",
                SensorType.Load => "%",
                SensorType.Clock => "MHz",
                SensorType.Fan => "RPM",
                SensorType.Power => "W",
                SensorType.Data => "GB",
                SensorType.Throughput => "B/s",
                _ => ""
            };
        }

        public void Dispose()
        {
            Dispose(true);
            GC.SuppressFinalize(this);
        }

        protected virtual void Dispose(bool disposing)
        {
            if (!_disposed)
            {
                if (disposing)
                {
                    _computer?.Close();
                }
                _disposed = true;
            }
        }

        private bool IsVTEnabled()
        {
            if (_vtCachedStatus.HasValue)
            {
                return _vtCachedStatus.Value;
            }

            try
            {
                using var powerShell = new Process();
                powerShell.StartInfo = new ProcessStartInfo
                {
                    FileName = "powershell.exe",
                    Arguments = "-Command \"(Get-CimInstance Win32_Processor).VirtualizationFirmwareEnabled\"",
                    RedirectStandardOutput = true,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    Verb = "runas"
                };

                powerShell.Start();
                string output = powerShell.StandardOutput.ReadToEnd().Trim();
                powerShell.WaitForExit();

                if (bool.TryParse(output, out bool vtEnabled))
                {
                    _vtCachedStatus = vtEnabled;
                    return vtEnabled;
                }
            }
            catch
            {
                _vtCachedStatus = false;
            }

            return _vtCachedStatus ?? false;
        }

        private static string GetLanIP()
        {
            try
            {
                var interfaces = System.Net.NetworkInformation.NetworkInterface.GetAllNetworkInterfaces();

                foreach (var intf in interfaces)
                {
                    if (intf.OperationalStatus != System.Net.NetworkInformation.OperationalStatus.Up ||
                        intf.NetworkInterfaceType == System.Net.NetworkInformation.NetworkInterfaceType.Loopback ||
                        intf.NetworkInterfaceType == System.Net.NetworkInformation.NetworkInterfaceType.Tunnel)
                    {
                        continue;
                    }

                    var ipProps = intf.GetIPProperties();

                    if (ipProps.GatewayAddresses.Count > 0)
                    {
                        var unicastIPs = ipProps.UnicastAddresses
                            .Where(ua => ua.Address.AddressFamily == AddressFamily.InterNetwork &&
                                        !IsSpecialIP(ua.Address.ToString()))
                            .ToList();

                        if (unicastIPs.Count > 0)
                        {
                            return unicastIPs[0].Address.ToString();
                        }
                    }
                }

                var host = Dns.GetHostEntry(Dns.GetHostName());
                var primaryIP = host.AddressList
                    .Where(ip => ip.AddressFamily == AddressFamily.InterNetwork &&
                               !IPAddress.IsLoopback(ip) &&
                               !IsSpecialIP(ip.ToString()))
                    .Select(ip => ip.ToString())
                    .FirstOrDefault();

                if (!string.IsNullOrEmpty(primaryIP))
                {
                    return primaryIP;
                }

                return "127.0.0.1";
            }
            catch
            {
                return "127.0.0.1";
            }
        }

        private static bool IsSpecialIP(string ip)
        {
            return ip.StartsWith("169.254.") ||
                   ip.StartsWith("127.") ||
                   ip.StartsWith("0.") ||
                   ip.StartsWith("224.") ||
                   ip.StartsWith("240.");
        }

        private static string GetHostName()
        {
            try
            {
                var primaryIP = GetLanIP();
                if (!string.IsNullOrEmpty(primaryIP) && primaryIP != "127.0.0.1")
                {
                    try
                    {
                        var hostEntry = Dns.GetHostEntry(primaryIP);
                        if (hostEntry.HostName != null && hostEntry.HostName != primaryIP)
                        {
                            var hostname = hostEntry.HostName.Split('.')[0];
                            if (!string.IsNullOrWhiteSpace(hostname) && hostname != "localhost")
                            {
                                return hostname;
                            }
                        }
                    }
                    catch
                    {
                        // con-meo-bu
                    }
                }

                return Environment.MachineName;
            }
            catch
            {
                return Environment.MachineName;
            }
        }

    }

    [JsonSerializable(typeof(List<HardwareInfo>))]
    [JsonSerializable(typeof(HardwareInfo))]
    [JsonSerializable(typeof(List<SensorInfo>))]
    [JsonSerializable(typeof(SensorInfo))]
    [JsonSerializable(typeof(HardwareResponse))]
    public partial class HardwareInfoContext : JsonSerializerContext
    {
    }

    public class HardwareResponse
    {
        public string HostName { get; set; } = Environment.MachineName;
        public string LocalIP { get; set; } = "";
        public long Timestamp { get; set; }
        public List<HardwareInfo> Hardware { get; set; } = [];
    }

    public class HardwareInfo
    {
        public string Name { get; set; } = string.Empty;
        public string HardwareType { get; set; } = string.Empty;
        public List<SensorInfo> Sensors { get; set; } = [];
    }

    public class SensorInfo
    {
        public string Name { get; set; } = string.Empty;
        public string SensorType { get; set; } = string.Empty;
        public double Value { get; set; }
        public string Unit { get; set; } = string.Empty;
    }
}