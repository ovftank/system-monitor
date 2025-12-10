import logo from '@/assets/images/logo.png';
import { IconMinus, IconX } from '@tabler/icons-react';
import { Quit, WindowMinimise } from '@wails/runtime/runtime';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface HeaderProps {
    licenseExpire?: number | null;
}

const Header: FC<HeaderProps> = ({ licenseExpire }) => {
    const [countdownText, setCountdownText] = useState<string>('');

    useEffect(() => {
        if (!licenseExpire) return;

        const updateCountdown = () => {
            const now = Date.now();
            const expiryTime = licenseExpire * 1000;
            const difference = expiryTime - now;

            if (difference <= 0) {
                setCountdownText('Đã hết hạn');
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / 1000 / 60) % 60);
            const seconds = Math.floor((difference / 1000) % 60);

            setCountdownText(`${days}d ${hours}h ${minutes}m ${seconds}s`);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [licenseExpire]);

    return (
        <div className='flex w-full items-center justify-between border-b border-stone-200 bg-stone-50 px-4 py-2' style={{ '--wails-draggable': 'drag' } as any}>
            <div className='flex items-center gap-2'>
                <img src={logo} alt='System Monitor' className='h-6' />
                <span className='font-semibold text-stone-900'>System Monitor</span>
                {countdownText && <span className='ml-4 text-sm text-stone-600'>Bản quyền: {countdownText}</span>}
            </div>
            <div className='flex gap-2' style={{ '--wails-draggable': 'no-drag' } as any}>
                <button onClick={() => WindowMinimise()} className='rounded px-3 py-1 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900' title='Minimize'>
                    <IconMinus size={16} />
                </button>
                <button onClick={() => Quit()} className='hover:bg-crimson-600 rounded px-3 py-1 text-stone-600 transition-colors hover:text-white' title='Close'>
                    <IconX size={16} />
                </button>
            </div>
        </div>
    );
};

export default Header;
