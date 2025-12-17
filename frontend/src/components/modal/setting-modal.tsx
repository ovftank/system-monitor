import { IconX } from '@tabler/icons-react';
import { GetConfig, UpdateConfig } from '@wails/go/main/App';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface Config {
    ServerIP: string;
    DelayMs: number;
}

interface SettingModalProps {
    onClose: () => void;
}

const SettingModal: FC<SettingModalProps> = ({ onClose }) => {
    const [serverIP, setServerIP] = useState('');
    const [delayMs, setDelayMs] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        try {
            setLoading(true);
            const config: Config = await GetConfig();
            setServerIP(config.ServerIP || '127.0.0.1');
            setDelayMs(config.DelayMs || 1000);
            setError(null);
        } catch (err) {
            setError('Không thể tải cấu hình');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!serverIP.trim()) {
            setError('IP máy chủ không được để trống');
            return;
        }

        if (delayMs < 100) {
            setError('Độ trễ phải tối thiểu 100ms');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            await UpdateConfig(serverIP.trim(), delayMs);
            onClose();
        } catch (err) {
            setError('Không thể lưu cấu hình');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            onClose();
        }
    };

    return (
        <div className='fixed top-10 right-0 bottom-0 left-0 z-50 flex items-center justify-center bg-black/50'>
            <div className='w-80 rounded-lg border border-stone-300 bg-white shadow-xl'>
                <div className='flex items-center justify-between rounded-t-lg border-b border-stone-200 bg-stone-50 px-5 py-4'>
                    <p className='text-sm font-semibold text-stone-900'>Cài đặt máy chủ</p>
                    <button onClick={onClose} className='p-0 text-stone-600 transition-colors hover:text-stone-900'>
                        <IconX size={18} />
                    </button>
                </div>

                <div className='space-y-4 px-5 py-4'>
                    {error && <div className='rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700'>{error}</div>}

                    {loading ? (
                        <div className='space-y-4'>
                            <div className='animate-pulse'>
                                <div className='text-xs font-medium text-stone-700 mb-1'>IP máy chủ</div>
                                <div className='h-8 bg-stone-200 rounded'></div>
                            </div>
                            <div className='animate-pulse'>
                                <div className='text-xs font-medium text-stone-700 mb-1'>Refresh Delay (ms)</div>
                                <div className='h-8 bg-stone-200 rounded'></div>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className='space-y-1'>
                                <div className='text-xs font-medium text-stone-700'>IP máy chủ</div>
                                <input type='text' value={serverIP} onChange={(e) => setServerIP(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} placeholder='127.0.0.1' className='focus:ring-crimson-600 focus:border-crimson-600 w-full rounded border border-stone-300 px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50' />
                            </div>

                            <div className='space-y-1'>
                                <div className='text-xs font-medium text-stone-700'>Refresh Delay (ms)</div>
                                <input type='number' value={delayMs} onChange={(e) => setDelayMs(Number.parseInt(e.target.value) || 100)} onKeyDown={handleKeyDown} disabled={loading} min='100' step='100' className='focus:ring-crimson-600 focus:border-crimson-600 w-full rounded border border-stone-300 px-3 py-2 text-xs text-stone-900 placeholder-stone-400 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50' />
                                <div className='text-xs text-stone-600'>Tối thiểu: 100ms</div>
                            </div>
                        </>
                    )}
                </div>

                <div className='flex items-center gap-2 border-t border-stone-200 bg-stone-50 px-5 py-3'>
                    <button onClick={onClose} disabled={loading} className='flex-1 rounded border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:cursor-not-allowed disabled:bg-stone-50'>
                        Huỷ
                    </button>
                    <button onClick={handleSave} disabled={loading} className='bg-crimson-600 hover:bg-crimson-700 disabled:bg-crimson-400 flex-1 rounded px-3 py-1.5 text-xs font-medium text-white transition-colors disabled:cursor-not-allowed'>
                        {loading ? 'Đang lưu...' : 'Đồng ý'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingModal;
