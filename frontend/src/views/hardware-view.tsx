import { IconArtboard, IconBattery, IconClock, IconContainerFilled, IconCpu, IconCpu2, IconDeviceImac, IconLayersSubtract, IconNetwork, IconRefresh, IconRuler3, IconSettingsHeart, IconWifi } from '@tabler/icons-react';
import { GetMonitorData } from '@wails/go/main/App';
import type { FC, ReactNode } from 'react';
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

const HardwareView: FC = () => {
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
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getHardwareIcon = (hardwareType: string): ReactNode => {
        const icons: { [key: string]: ReactNode } = {
            Motherboard: <IconArtboard size={16} />,
            Cpu: <IconCpu size={16} />,
            Memory: <IconRuler3 size={16} />,
            GpuAmd: <IconCpu2 size={16} />,
            GpuIntel: <IconCpu2 size={16} />,
            Network: <IconNetwork size={16} />,
            Battery: <IconBattery size={16} />,
            Storage: <IconContainerFilled size={16} />
        };
        return icons[hardwareType] || <IconContainerFilled size={16} />;
    };

    const getHardwareNameByType = (hardware: Hardware[], type: string): string => {
        const hw = hardware.find((h) => h.HardwareType === type);
        return hw?.Name || '-';
    };

    const getVTValue = (hardware: Hardware[]): string => {
        const cpu = hardware.find((h) => h.HardwareType === 'Cpu');
        if (!cpu) return '-';
        const vtSensor = cpu.Sensors.find((s) => s.Name === 'VT-x Enabled');
        return vtSensor ? (vtSensor.Value === 1 ? 'Đã Bật' : 'Đã Tắt') : '-';
    };

    const getGPUNames = (hardware: Hardware[]): string => {
        const gpus = hardware.filter((h) => h.HardwareType.includes('Gpu'));
        return gpus.length > 0 ? gpus.map((g) => g.Name).join(', ') : '-';
    };

    const getRamTotal = (hardware: Hardware[]): string => {
        const memory = hardware.find((h) => h.HardwareType === 'Memory');
        if (!memory) return '-';
        const usedSensor = memory.Sensors.find((s) => s.Name === 'Memory Used');
        const availableSensor = memory.Sensors.find((s) => s.Name === 'Memory Available');
        if (!usedSensor || !availableSensor) return '-';
        const total = usedSensor.Value + availableSensor.Value;
        return `${total.toFixed(2)} ${usedSensor.Unit}`;
    };

    const isClientOnline = (timestamp: number): boolean => {
        const now = Math.floor(Date.now() / 1000);
        const diff = now - timestamp;
        return diff <= 10;
    };

    const getRamSpeed = (hardware: Hardware[]): string => {
        const memory = hardware.find((h) => h.HardwareType === 'Memory');
        if (!memory) return '-';
        const speedSensor = memory.Sensors.find((s) => s.Name === 'Memory Speed' && s.SensorType === 'Clock');
        return speedSensor ? `${speedSensor.Value.toFixed(0)} ${speedSensor.Unit}` : '-';
    };

    const getLanSpeed = (hardware: Hardware[]): string => {
        const networks = hardware.filter((h) => h.HardwareType === 'Network');
        if (networks.length === 0) return '-';

        for (const network of networks) {
            const linkSpeedSensor = network.Sensors.find((s) => s.Name === 'Link Speed' && s.SensorType === 'Data');
            if (linkSpeedSensor && linkSpeedSensor.Value > 0) {
                return `${linkSpeedSensor.Value.toFixed(0)} ${linkSpeedSensor.Unit}`;
            }
        }
        return '-';
    };

    return (
        <div className='flex h-full flex-col bg-white p-4'>
            <div className='mb-4 flex items-center justify-between'>
                <p className='flex items-center gap-2 text-lg font-semibold text-stone-900'>
                    <IconSettingsHeart className='h-5 w-5' />
                    Phần cứng
                </p>
                <div className='flex items-center gap-2'>
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
                                <th className='px-4 py-2 text-left font-semibold text-stone-700'>
                                    <span className='flex items-center gap-2'>
                                        <IconNetwork size={16} />
                                        IP
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-left font-semibold text-stone-700'>
                                    <span className='flex items-center gap-2'>
                                        {getHardwareIcon('Motherboard')}
                                        Main
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-left font-semibold text-stone-700'>
                                    <span className='flex items-center gap-2'>
                                        {getHardwareIcon('Cpu')}
                                        CPU
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-left font-semibold text-stone-700'>
                                    <span className='flex items-center gap-2'>
                                        {getHardwareIcon('GpuAmd')}
                                        GPU
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-left font-semibold text-stone-700'>
                                    <span className='flex items-center gap-2'>
                                        {getHardwareIcon('Memory')}
                                        RAM Total
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-2'>
                                        <IconClock size={16} />
                                        RAM Speed
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-2'>
                                        <IconWifi size={16} />
                                        LAN Speed
                                    </span>
                                </th>
                                <th className='px-4 py-2 text-center font-semibold text-stone-700'>
                                    <span className='flex items-center justify-center gap-2'>
                                        <IconLayersSubtract size={16} />
                                        VT-x
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.Clients.sort((a, b) => a.Data.HostName.localeCompare(b.Data.HostName)).map((client) => {
                                const isOnline = isClientOnline(client.Data.Timestamp);
                                return (
                                    <tr key={client.ClientId} className='border-b border-stone-200 hover:bg-stone-50'>
                                        <td className='px-4 py-2 font-medium text-stone-900'>
                                            <div className='flex items-center gap-2'>
                                                <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-stone-400'}`} title={isOnline ? 'Online' : 'Offline'}></div>
                                                {client.Data.HostName}
                                            </div>
                                        </td>
                                        <td className='px-4 py-2 text-stone-700'>{client.Data.LocalIP}</td>
                                        <td className='px-4 py-2 text-stone-900'>{getHardwareNameByType(client.Data.Hardware, 'Motherboard')}</td>
                                        <td className='px-4 py-2 text-stone-900'>{getHardwareNameByType(client.Data.Hardware, 'Cpu')}</td>
                                        <td className='px-4 py-2 text-stone-900'>{getGPUNames(client.Data.Hardware)}</td>
                                        <td className='px-4 py-2 text-stone-900'>{getRamTotal(client.Data.Hardware)}</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{getRamSpeed(client.Data.Hardware)}</td>
                                        <td className='px-4 py-2 text-center text-stone-700'>{getLanSpeed(client.Data.Hardware)}</td>
                                        <td className='px-4 py-2 text-center font-medium text-stone-700'>{getVTValue(client.Data.Hardware)}</td>
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

export default HardwareView;

