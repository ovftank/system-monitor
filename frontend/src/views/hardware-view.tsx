import { IconArtboard, IconBattery, IconContainerFilled, IconCpu, IconCpu2, IconDeviceImac, IconLayersSubtract, IconNetwork, IconRefresh, IconRuler3, IconSettingsHeart } from '@tabler/icons-react';
import { GetMonitorData } from '@wails/go/main/App';
import type { FC, ReactNode } from 'react';
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
        const hw = hardware.find((h) => h.hardwareType === type);
        return hw?.name || '-';
    };

    const getVTValue = (hardware: Hardware[]): string => {
        const cpu = hardware.find((h) => h.hardwareType === 'Cpu');
        if (!cpu) return '-';
        const vtSensor = cpu.sensors.find((s) => s.name === 'VT-x Enabled');
        return vtSensor ? (vtSensor.value === 1 ? 'Đã Bật' : 'Đã Tắt') : '-';
    };

    const getGPUNames = (hardware: Hardware[]): string => {
        const gpus = hardware.filter((h) => h.hardwareType.includes('Gpu'));
        return gpus.length > 0 ? gpus.map((g) => g.name).join(', ') : '-';
    };

    const getRamTotal = (hardware: Hardware[]): string => {
        const memory = hardware.find((h) => h.hardwareType === 'Memory');
        if (!memory) return '-';
        const usedSensor = memory.sensors.find((s) => s.name === 'Memory Used');
        const availableSensor = memory.sensors.find((s) => s.name === 'Memory Available');
        if (!usedSensor || !availableSensor) return '-';
        const total = usedSensor.value + availableSensor.value;
        return `${total.toFixed(2)} ${usedSensor.unit}`;
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
                                        <IconLayersSubtract size={16} />
                                        VT-x
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.clients.map((client) => (
                                <tr key={client.clientId} className='border-b border-stone-200 hover:bg-stone-50'>
                                    <td className='px-4 py-2 font-medium text-stone-900'>{client.data.hostName}</td>
                                    <td className='px-4 py-2 text-stone-700'>{client.data.localIP}</td>
                                    <td className='px-4 py-2 text-stone-900'>{getHardwareNameByType(client.data.hardware, 'Motherboard')}</td>
                                    <td className='px-4 py-2 text-stone-900'>{getHardwareNameByType(client.data.hardware, 'Cpu')}</td>
                                    <td className='px-4 py-2 text-stone-900'>{getGPUNames(client.data.hardware)}</td>
                                    <td className='px-4 py-2 text-stone-900'>{getRamTotal(client.data.hardware)}</td>
                                    <td className='px-4 py-2 text-center font-medium text-stone-700'>{getVTValue(client.data.hardware)}</td>
                                </tr>
                            ))}
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
