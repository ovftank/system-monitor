import { IconActivity, IconBolt, IconCpu, IconCpu2, IconDeviceImac, IconDownload, IconRefresh, IconThermometer, IconUpload, IconWind } from '@tabler/icons-react';
import { GetMonitorData } from '@wails/go/main/App';
import { EventsOn } from '@wails/runtime/runtime';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface Sensor {
    Name: string;
    SensorType: string;
    Value: number;
    Unit: string;
}

interface Hardware {
    Name: string;
    HardwareType: string;
    Sensors: Sensor[];
}

interface ClientData {
    HostName: string;
    LocalIP: string;
    Timestamp: number;
    Hardware: Hardware[];
}

interface Client {
    ClientId: string;
    Data: ClientData;
}

interface MonitorResponse {
    TotalClients: number;
    Clients: Client[];
}

const ActivityView: FC = () => {
    const [data, setData] = useState<MonitorResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await GetMonitorData();
            setData(response);
            setLastUpdate(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();

        const unsubscribe = EventsOn('monitorUpdate', fetchData);

        return () => {
            unsubscribe();
        };
    }, []);

    const getCPUMetrics = (hardware: Hardware[]) => {
        const cpu = hardware.find((h) => h.HardwareType === 'Cpu');
        if (!cpu) return { load: 0, temp: 0, clock: 0, power: 0, fan: 0 };

        const load = cpu.Sensors.find((s) => s.Name === 'CPU Usage' && s.SensorType === 'Load');
        const temp = cpu.Sensors.find((s) => s.Name === 'CPU Temperature' && s.SensorType === 'Temperature');
        const clock = cpu.Sensors.find((s) => s.Name === 'CPU Clock' && s.SensorType === 'Clock');
        const power = cpu.Sensors.find((s) => s.Name === 'CPU Power' && s.SensorType === 'Power');
        const fan = cpu.Sensors.find((s) => s.SensorType === 'Fan');

        return {
            load: load?.Value || 0,
            temp: temp?.Value || 0,
            clock: clock?.Value || 0,
            power: power?.Value || 0,
            fan: fan?.Value || 0
        };
    };

    const getGPUMetrics = (hardware: Hardware[]) => {
        const gpus = hardware.filter((h) => h.HardwareType.includes('Gpu'));
        if (gpus.length === 0) return { load: 0, temp: 0, clock: 0, power: 0, fan: 0, hasLoad: false, hasTemp: false, hasClock: false, hasPower: false, hasFan: false };

        let maxLoad = 0;
        let maxTemp = 0;
        let maxClock = 0;
        let maxPower = 0;
        let maxFan = 0;
        let hasLoad = false;
        let hasTemp = false;
        let hasClock = false;
        let hasPower = false;
        let hasFan = false;

        gpus.forEach((gpu) => {
            const gpuLoad = gpu.Sensors.find((s) => s.Name === 'GPU Usage' && s.SensorType === 'Load');
            if (gpuLoad) {
                hasLoad = true;
                if (gpuLoad.Value > maxLoad) {
                    maxLoad = gpuLoad.Value;
                }
            }

            const temp = gpu.Sensors.find((s) => s.Name === 'GPU Temperature' && s.SensorType === 'Temperature');
            if (temp && temp.Value > 0) {
                hasTemp = true;
                if (temp.Value > maxTemp) {
                    maxTemp = temp.Value;
                }
            }

            const clock = gpu.Sensors.find((s) => s.Name === 'GPU Clock' && s.SensorType === 'Clock');
            if (clock) {
                hasClock = true;
                if (clock.Value > maxClock) {
                    maxClock = clock.Value;
                }
            }

            const power = gpu.Sensors.find((s) => s.Name === 'GPU Power' && s.SensorType === 'Power');
            if (power) {
                hasPower = true;
                if (power.Value > maxPower) {
                    maxPower = power.Value;
                }
            }

            const fan = gpu.Sensors.find((s) => s.SensorType === 'Fan' && s.Name === 'GPU Fan');
            if (fan) {
                hasFan = true;
                if (fan.Value > maxFan) {
                    maxFan = fan.Value;
                }
            }
        });

        return {
            load: maxLoad,
            temp: maxTemp,
            clock: maxClock,
            power: maxPower,
            fan: maxFan,
            hasLoad,
            hasTemp,
            hasClock,
            hasPower,
            hasFan
        };
    };

    const getRAMMetrics = (hardware: Hardware[]) => {
        const mem = hardware.find((h) => h.HardwareType === 'Memory');
        if (!mem) return { used: 0, total: 0, percentage: 0 };
        const used = mem.Sensors.find((s) => s.Name === 'Memory Used');
        const available = mem.Sensors.find((s) => s.Name === 'Memory Available');
        const percentage = mem.Sensors.find((s) => s.Name === 'Memory' && s.SensorType === 'Load');
        const usedValue = used?.Value || 0;
        const availableValue = available?.Value || 0;
        const total = usedValue + availableValue;
        return {
            used: usedValue,
            total: total,
            percentage: percentage?.Value || 0
        };
    };

    const getNetworkMetrics = (hardware: Hardware[]) => {
        const networks = hardware.filter((h) => h.HardwareType === 'Network');
        if (networks.length === 0) return { upload: 0, download: 0 };
        let totalUp = 0;
        let totalDown = 0;
        networks.forEach((net) => {
            const up = net.Sensors.find((s) => s.Name === 'Upload Speed' && s.SensorType === 'Throughput');
            const down = net.Sensors.find((s) => s.Name === 'Download Speed' && s.SensorType === 'Throughput');
            totalUp += up?.Value || 0;
            totalDown += down?.Value || 0;
        });
        return { upload: totalUp, download: totalDown };
    };

    const getStatusColor = (value: number, type: 'load' | 'temp') => {
        if (type === 'load') {
            if (value < 50) return 'text-green-600';
            if (value < 80) return 'text-yellow-600';
            return 'text-red-600';
        }
        if (type === 'temp') {
            if (value < 60) return 'text-green-600';
            if (value < 80) return 'text-yellow-600';
            return 'text-red-600';
        }
        return 'text-stone-700';
    };

    const formatBytes = (bytes: number) => {
        if (bytes === 0) return '0 B/s';
        const k = 1024;
        const sizes = ['B/s', 'KB/s', 'MB/s', 'GB/s'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return (bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i];
    };

    const isClientOnline = (timestamp: number): boolean => {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        return diff <= 10;
    };

    return (
        <div className='flex h-full flex-col bg-white p-4'>
            <div className='mb-4 flex items-center justify-between'>
                <p className='flex items-center gap-2 text-lg font-semibold text-stone-900'>
                    <IconActivity className='h-5 w-5' />
                    Hoạt động
                </p>
                <div className='flex items-center gap-2'>
                    {data && (
                        <span className='text-sm font-medium text-stone-700'>
                            Tổng số máy: {data.Clients.filter((client) => isClientOnline(client.Data.Timestamp)).length}/{data.TotalClients}
                        </span>
                    )}
                    <button onClick={fetchData} disabled={loading} className='rounded p-1.5 transition-colors hover:bg-stone-100 disabled:opacity-50' title='Làm mới'>
                        <IconRefresh size={18} />
                    </button>
                    {lastUpdate && <span className='text-xs text-stone-600'>Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}</span>}
                </div>
            </div>

            {error && <div className='mb-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700'>{error}</div>}
            {data && data.Clients.length > 0 ? (
                <div className='flex-1 overflow-auto'>
                    <table className='w-full border-collapse text-xs'>
                        <thead className='sticky top-0 border-b border-stone-200 bg-stone-50'>
                            <tr>
                                <th className='px-4 py-2 text-left font-semibold text-stone-700'>
                                    <span className='flex items-center gap-2'>
                                        <IconDeviceImac size={16} />
                                        Máy
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconCpu size={16} />
                                        CPU Load
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconThermometer size={16} />
                                        CPU Temp
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconBolt size={16} />
                                        CPU Clock
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconBolt size={16} />
                                        CPU Power
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconWind size={16} />
                                        CPU Fan
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconCpu2 size={16} />
                                        GPU Load
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconThermometer size={16} />
                                        GPU Temp
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconBolt size={16} />
                                        GPU Clock
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconBolt size={16} />
                                        GPU Power
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconWind size={16} />
                                        GPU Fan
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconCpu size={16} />
                                        RAM
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconDownload size={16} />
                                        Download
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-1'>
                                        <IconUpload size={16} />
                                        Upload
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.Clients.toSorted((a, b) => a.Data.HostName.localeCompare(b.Data.HostName)).map((client) => {
                                const cpuMetrics = getCPUMetrics(client.Data.Hardware);
                                const gpuMetrics = getGPUMetrics(client.Data.Hardware);
                                const ramMetrics = getRAMMetrics(client.Data.Hardware);
                                const networkMetrics = getNetworkMetrics(client.Data.Hardware);
                                const isOnline = isClientOnline(client.Data.Timestamp);

                                return (
                                    <tr key={client.ClientId} className='border-b border-stone-200 hover:bg-stone-50'>
                                        <td className='px-4 py-2 font-medium text-stone-900'>
                                            <div className='flex items-center gap-2'>
                                                <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-stone-400'}`} title={isOnline ? 'Online' : 'Offline'}></div>
                                                {client.Data.HostName}
                                            </div>
                                        </td>
                                        <td className={`px-4 py-2 text-center font-medium ${getStatusColor(cpuMetrics.load, 'load')}`}>{cpuMetrics.load.toFixed(1)}%</td>
                                        <td className={`px-4 py-2 text-center font-medium ${getStatusColor(cpuMetrics.temp, 'temp')}`}>{cpuMetrics.temp.toFixed(0)}°C</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{cpuMetrics.clock.toFixed(0)} MHz</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{cpuMetrics.power.toFixed(2)} W</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{cpuMetrics.fan > 0 ? `${cpuMetrics.fan.toFixed(0)} RPM` : '-'}</td>
                                        <td className={`px-4 py-2 text-center font-medium ${gpuMetrics.hasLoad ? getStatusColor(gpuMetrics.load, 'load') : 'text-stone-400'}`}>{gpuMetrics.hasLoad ? `${gpuMetrics.load.toFixed(1)}%` : '-'}</td>
                                        <td className={`px-4 py-2 text-center font-medium ${gpuMetrics.hasTemp ? getStatusColor(gpuMetrics.temp, 'temp') : 'text-stone-400'}`}>{gpuMetrics.hasTemp ? `${gpuMetrics.temp.toFixed(0)}°C` : '-'}</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{gpuMetrics.hasClock ? `${gpuMetrics.clock.toFixed(0)} MHz` : <span className='text-stone-400'>-</span>}</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{gpuMetrics.hasPower ? `${gpuMetrics.power.toFixed(2)} W` : <span className='text-stone-400'>-</span>}</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{gpuMetrics.hasFan ? `${gpuMetrics.fan.toFixed(0)} RPM` : <span className='text-stone-400'>-</span>}</td>
                                        <td className='px-4 py-2 text-center'>
                                            <span className='font-medium text-stone-700'>{ramMetrics.used.toFixed(1)}</span>
                                            <span className='text-stone-600'> / {ramMetrics.total.toFixed(1)} GB</span>
                                        </td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{formatBytes(networkMetrics.download)}</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{formatBytes(networkMetrics.upload)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className='flex flex-1 items-center justify-center text-stone-600'>{loading ? 'Đang tải dữ liệu...' : 'Không có dữ liệu'}</div>
            )}
        </div>
    );
};

export default ActivityView;

