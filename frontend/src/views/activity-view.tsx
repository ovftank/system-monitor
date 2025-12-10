import { IconActivity, IconBolt, IconCpu, IconCpu2, IconDeviceImac, IconDownload, IconNetwork, IconRefresh, IconThermometer, IconUpload, IconWind } from '@tabler/icons-react';
import { GetMonitorData } from '@wails/go/main/App';
import { EventsOn } from '@wails/runtime/runtime';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface Sensor {
    name: string;
    sensorType: string;
    value: number;
    unit: string;
}

interface Hardware {
    name: string;
    hardwareType: string;
    sensors: Sensor[];
}

interface ClientData {
    hostName: string;
    localIP: string;
    hardware: Hardware[];
}

interface Client {
    clientId: string;
    data: ClientData;
}

interface MonitorResponse {
    totalClients: number;
    clients: Client[];
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
        const cpu = hardware.find((h) => h.hardwareType === 'Cpu');
        if (!cpu) return { load: 0, temp: 0, clock: 0, power: 0, fan: 0 };
        const load = cpu.sensors.find((s) => s.name === 'CPU Total' && s.sensorType === 'Load');
        const temp = cpu.sensors.find((s) => s.name === 'Core Max' && s.sensorType === 'Temperature');
        const clock = cpu.sensors.find((s) => s.name === 'CPU Core #1' && s.sensorType === 'Clock');
        const power = cpu.sensors.find((s) => s.name === 'CPU Package' && s.sensorType === 'Power');
        const fan = cpu.sensors.find((s) => (s.name === 'CPU Fan' || s.name === 'CPU Optional Fan' || s.name.startsWith('CPU Fan #')) && s.sensorType === 'Fan');
        return {
            load: load?.value || 0,
            temp: temp?.value || 0,
            clock: clock?.value || 0,
            power: power?.value || 0,
            fan: fan?.value || 0
        };
    };

    const getGPUMetrics = (hardware: Hardware[]) => {
        const gpus = hardware.filter((h) => h.hardwareType.includes('Gpu'));
        if (gpus.length === 0) return { load: 0, temp: 0, clock: 0, power: 0, fan: 0 };

        let maxLoad = 0;
        let maxTemp = 0;
        let maxClock = 0;
        let maxPower = 0;
        let maxFan = 0;

        gpus.forEach((gpu) => {
            const d3dLoad = gpu.sensors.find((s) => s.name === 'D3D 3D' && s.sensorType === 'Load');
            if (d3dLoad && d3dLoad.value > maxLoad) {
                maxLoad = d3dLoad.value;
            }

            const temp = gpu.sensors.find((s) => s.name === 'GPU Core' && s.sensorType === 'Temperature');
            if (temp && temp.value > 0 && temp.value > maxTemp) {
                maxTemp = temp.value;
            }

            const clock = gpu.sensors.find((s) => s.name === 'GPU Core' && s.sensorType === 'Clock');
            if (clock && clock.value > maxClock) {
                maxClock = clock.value;
            }

            const power = gpu.sensors.find((s) => s.name === 'GPU Power' && s.sensorType === 'Power');
            if (power && power.value > maxPower) {
                maxPower = power.value;
            }

            const fan = gpu.sensors.find((s) => s.name === 'GPU Fan' && s.sensorType === 'Fan');
            if (fan && fan.value > maxFan) {
                maxFan = fan.value;
            }
        });

        return {
            load: maxLoad,
            temp: maxTemp,
            clock: maxClock,
            power: maxPower,
            fan: maxFan
        };
    };

    const getRAMMetrics = (hardware: Hardware[]) => {
        const mem = hardware.find((h) => h.hardwareType === 'Memory');
        if (!mem) return { used: 0, total: 0, percentage: 0 };
        const used = mem.sensors.find((s) => s.name === 'Memory Used');
        const available = mem.sensors.find((s) => s.name === 'Memory Available');
        const percentage = mem.sensors.find((s) => s.name === 'Memory' && s.sensorType === 'Load');
        const usedValue = used?.value || 0;
        const availableValue = available?.value || 0;
        const total = usedValue + availableValue;
        return {
            used: usedValue,
            total: total,
            percentage: percentage?.value || 0
        };
    };

    const getNetworkMetrics = (hardware: Hardware[]) => {
        const networks = hardware.filter((h) => h.hardwareType === 'Network');
        if (networks.length === 0) return { upload: 0, download: 0 };
        let totalUp = 0;
        let totalDown = 0;
        networks.forEach((net) => {
            const up = net.sensors.find((s) => s.name === 'Upload Speed');
            const down = net.sensors.find((s) => s.name === 'Download Speed');
            totalUp += up?.value || 0;
            totalDown += down?.value || 0;
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

    return (
        <div className='flex h-full flex-col bg-white p-4'>
            <div className='mb-4 flex items-center justify-between'>
                <p className='flex items-center gap-2 text-lg font-semibold text-stone-900'>
                    <IconActivity className='h-5 w-5' />
                    Hoạt động
                </p>
                <div className='flex items-center gap-2'>
                    <button onClick={fetchData} disabled={loading} className='rounded p-1.5 transition-colors hover:bg-stone-100 disabled:opacity-50' title='Làm mới'>
                        <IconRefresh size={18} />
                    </button>
                    {lastUpdate && <span className='text-xs text-stone-600'>Cập nhật: {lastUpdate.toLocaleTimeString('vi-VN')}</span>}
                </div>
            </div>

            {error && <div className='mb-4 rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700'>{error}</div>}
            {data && data.clients.length > 0 ? (
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
                                <th className='px-4 py-2 text-left font-semibold text-stone-700'>
                                    <span className='flex items-center gap-2'>
                                        <IconNetwork size={16} />
                                        IP
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
                            {data.clients.map((client) => {
                                const cpuMetrics = getCPUMetrics(client.data.hardware);
                                const gpuMetrics = getGPUMetrics(client.data.hardware);
                                const ramMetrics = getRAMMetrics(client.data.hardware);
                                const networkMetrics = getNetworkMetrics(client.data.hardware);

                                return (
                                    <tr key={client.clientId} className='border-b border-stone-200 hover:bg-stone-50'>
                                        <td className='px-4 py-2 font-medium text-stone-900'>{client.data.hostName}</td>
                                        <td className='px-4 py-2 text-stone-700'>{client.data.localIP}</td>
                                        <td className={`px-4 py-2 text-center font-medium ${getStatusColor(cpuMetrics.load, 'load')}`}>{cpuMetrics.load.toFixed(1)}%</td>
                                        <td className={`px-4 py-2 text-center font-medium ${getStatusColor(cpuMetrics.temp, 'temp')}`}>{cpuMetrics.temp.toFixed(0)}°C</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{cpuMetrics.clock.toFixed(0)} MHz</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{cpuMetrics.power.toFixed(2)} W</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{cpuMetrics.fan.toFixed(0)} RPM</td>
                                        <td className={`px-4 py-2 text-center font-medium ${getStatusColor(gpuMetrics.load, 'load')}`}>{gpuMetrics.load.toFixed(1)}%</td>
                                        <td className={`px-4 py-2 text-center font-medium ${getStatusColor(gpuMetrics.temp, 'temp')}`}>{gpuMetrics.temp.toFixed(0)}°C</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{gpuMetrics.clock.toFixed(0)} MHz</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{gpuMetrics.power.toFixed(2)} W</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{gpuMetrics.fan.toFixed(0)} RPM</td>
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
