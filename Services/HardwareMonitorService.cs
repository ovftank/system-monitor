 using System.Management;
using System.Text.Json.Serialization;
using LibreHardwareMonitor.Hardware;

namespace sppc.Services
{
    public class HardwareMonitorService : IDisposable
    {
        private readonly Computer _computer;
        private bool _disposed = false;
        private bool? _vtCachedStatus = null;
        private static readonly string _cachedHostName = Environment.MachineName;

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