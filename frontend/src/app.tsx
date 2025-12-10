import Intro from '@/assets/video/intro.mp4';
import Header from '@/components/header';
import Navbar from '@/components/navbar';
import ActivityView from '@/views/activity-view';
import AuthView from '@/views/auth-view';
import HardwareView from '@/views/hardware-view';
import { CheckToken } from '@wails/go/main/App';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
const App: FC = () => {
    const [activeTab, setActiveTab] = useState<'activity' | 'hardware'>('activity');
    const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showVideo, setShowVideo] = useState<boolean>(true);
    const [licenseExpire, setLicenseExpire] = useState<number | null>(null);

    useEffect(() => {
        const validateToken = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (token && CheckToken) {
                    const response = await CheckToken(token);
                    if (response) {
                        setIsTokenValid(true);
                        setLicenseExpire(response.license_expire);
                    } else {
                        setIsTokenValid(false);
                    }
                }
                setIsLoading(false);
            } catch {
                setIsLoading(false);
            }
        };

        validateToken();
    }, []);

    useEffect(() => {
        if (!isTokenValid) {
            const timer = setTimeout(() => setShowVideo(false), 4500);
            return () => clearTimeout(timer);
        }
    }, [isTokenValid]);

    if (isLoading) {
        return <div className='flex h-screen items-center justify-center'>Loading...</div>;
    }

    if (!isTokenValid) {
        return (
            <div className='flex h-screen flex-col bg-white'>
                <Header />
                {showVideo ? (
                    <video autoPlay className='fixed inset-0 z-50 m-auto h-auto w-3/5 rounded-lg'>
                        <source src={Intro} type='video/mp4' />
                        <track kind='captions' />
                    </video>
                ) : (
                    <AuthView />
                )}
            </div>
        );
    }

    return (
        <div className='flex h-screen flex-col bg-white'>
            <Header licenseExpire={licenseExpire} />
            <div className='flex flex-1 overflow-hidden'>
                <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
                <main className='flex-1 overflow-hidden'>
                    {activeTab === 'activity' && <ActivityView />}
                    {activeTab === 'hardware' && <HardwareView />}
                </main>
            </div>
        </div>
    );
};

export default App;
