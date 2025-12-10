import SettingModal from '@/components/modal/setting-modal';
import { IconActivity, IconCloudCog, IconLogout, IconSettingsHeart } from '@tabler/icons-react';
import type { FC } from 'react';
import { useState } from 'react';
interface NavbarProps {
    activeTab: 'activity' | 'hardware';
    onTabChange: (tab: 'activity' | 'hardware') => void;
}

const Navbar: FC<NavbarProps> = ({ activeTab, onTabChange }) => {
    const [showSettings, setShowSettings] = useState(false);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        window.location.reload();
    };

    return (
        <>
            <div className='flex w-14 flex-col items-center border-r border-stone-200 bg-stone-50 py-2'>
                <nav className='flex flex-col gap-2'>
                    <button onClick={() => onTabChange('activity')} className={`rounded p-2 transition-colors ${activeTab === 'activity' ? 'bg-crimson-600 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`} title='Hoạt động'>
                        <IconActivity size={16} />
                    </button>

                    <button onClick={() => onTabChange('hardware')} className={`rounded p-2 transition-colors ${activeTab === 'hardware' ? 'bg-crimson-600 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'}`} title='Phần cứng'>
                        <IconSettingsHeart size={16} />
                    </button>
                </nav>

                <div className='flex-1' />

                <div className='flex flex-col gap-2 border-t border-stone-200 pt-2'>
                    <button onClick={() => setShowSettings(true)} className='rounded p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900' title='Cài đặt'>
                        <IconCloudCog size={16} />
                    </button>

                    <button onClick={handleLogout} className='rounded p-2 text-stone-600 transition-colors hover:bg-stone-100 hover:text-stone-900' title='Đăng xuất'>
                        <IconLogout size={16} />
                    </button>
                </div>
            </div>

            {showSettings && <SettingModal onClose={() => setShowSettings(false)} />}
        </>
    );
};

export default Navbar;
