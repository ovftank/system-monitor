using System.Management;
using System.Net;
using System.Net.Sockets;
using System.Text.Json.Serialization;
using LibreHardwareMonitor.Hardware;

namespace sppc.Services
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
                IsControllerEnabled = true,
                IsNetworkEnabled = true,
                IsStorageEnabled = true,
                IsBatteryEnabled = true,
                IsPsuEnabled = true
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
                var hardwareInfo = CreateHardwareInfo(hardware);
                hardwareInfoList.Add(hardwareInfo);
            }

            return new HardwareResponse
            {
                HostName = _cachedHostName,
                LocalIP = _cachedLocalIP,
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

            AddVTStatusIfNeeded(hardwareInfo, hardware);
            AddSensors(hardwareInfo, hardware.Sensors);
            AddSubHardwareSensors(hardwareInfo, hardware.SubHardware);

            return hardwareInfo;
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
                SensorType.Flow => "L/h",
                SensorType.Control => "%",
                SensorType.Level => "%",
                SensorType.Power => "W",
                SensorType.Data => "GB",
                SensorType.Frequency => "Hz",
                SensorType.Voltage => "V",
                SensorType.Current => "A",
                SensorType.Throughput => "B/s",
                SensorType.Energy => "J",
                SensorType.Factor => "",
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
                var searcher = new ManagementObjectSearcher("select * from Win32_Processor");
                var cpus = searcher.Get().GetEnumerator();

                if (cpus.MoveNext())
                {
                    var cpu = (ManagementObject)cpus.Current;
                    _vtCachedStatus = (bool)cpu["VirtualizationFirmwareEnabled"];
                    return _vtCachedStatus.Value;
                }
            }
            catch
            {
                _vtCachedStatus = false;
            }

            _vtCachedStatus = false;
            return _vtCachedStatus.Value;
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