import Intro from '@/assets/video/intro.mp4';
import Header from '@/components/header';
import CreditModal from '@/components/modal/credit-modal';
import Navbar from '@/components/navbar';
import ActivityView from '@/views/activity-view';
import AuthView from '@/views/auth-view';
import HardwareView from '@/views/hardware-view';
import { IconDeviceComputerCamera, IconDeviceDesktop, IconDevicesPc, IconHeadset, IconPhone, IconReceiptRefund, IconTir } from '@tabler/icons-react';
import { CheckToken, OpenBrowser } from '@wails/go/main/App';
import type { FC } from 'react';
import { useEffect, useState } from 'react';
const App: FC = () => {
    const [activeTab, setActiveTab] = useState<'activity' | 'hardware'>('activity');
    const [isTokenValid, setIsTokenValid] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [showVideo, setShowVideo] = useState<boolean>(true);
    const [licenseExpire, setLicenseExpire] = useState<number | null>(null);
    const [showCreditModal, setShowCreditModal] = useState<boolean>(false);

    useEffect(() => {
        const validateToken = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (token && CheckToken) {
                    const response = await CheckToken(token);
                    if (response?.success) {
                        setIsTokenValid(true);
                        if (response.data && typeof response.data === 'object' && 'license_expire' in response.data) {
                            setLicenseExpire(response.data.license_expire);
                        }
                    } else {
                        setIsTokenValid(false);
                        localStorage.removeItem('authToken');
                        setLicenseExpire(null);
                    }
                } else {
                    setIsTokenValid(false);
                    setLicenseExpire(null);
                }
                setIsLoading(false);
            } catch {
                setIsLoading(false);
                setIsTokenValid(false);
                localStorage.removeItem('authToken');
                setLicenseExpire(null);
            }
        };

        validateToken();

        const intervalId = setInterval(async () => {
            const token = localStorage.getItem('authToken');
            if (token && CheckToken) {
                try {
                    const response = await CheckToken(token);
                    if (response?.success) {
                        setIsTokenValid(true);
                        if (response.data && typeof response.data === 'object' && 'license_expire' in response.data) {
                            setLicenseExpire(response.data.license_expire);
                        }
                    } else {
                        setIsTokenValid(false);
                        localStorage.removeItem('authToken');
                        setLicenseExpire(null);
                    }
                } catch {
                    setIsTokenValid(false);
                    localStorage.removeItem('authToken');
                    setLicenseExpire(null);
                }
            } else {
                setIsTokenValid(false);
                setLicenseExpire(null);
            }
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (!isTokenValid) {
            const timer = setTimeout(() => setShowVideo(false), 4500);
            return () => clearTimeout(timer);
        }
    }, [isTokenValid]);

    if (isLoading) {
        return <></>;
    }

    if (!isTokenValid) {
        return (
            <div className='flex h-screen flex-col bg-white'>
                <Header onShowCredit={() => setShowCreditModal(true)} />
                {showVideo ? (
                    <video autoPlay className='fixed inset-0 z-50 m-auto h-auto w-3/5 rounded-lg'>
                        <source src={Intro} type='video/mp4' />
                        <track kind='captions' />
                    </video>
                ) : (
                    <AuthView />
                )}
                {showCreditModal && <CreditModal onClose={() => setShowCreditModal(false)} />}
            </div>
        );
    }

    return (
        <div className='flex h-screen flex-col bg-white'>
            <Header licenseExpire={licenseExpire} onShowCredit={() => setShowCreditModal(true)} />
            <div className='flex flex-1 overflow-hidden'>
                <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
                <main className='flex flex-1 flex-col overflow-hidden'>
                    <div className='flex-1 overflow-hidden'>
                        {activeTab === 'activity' && <ActivityView />}
                        {activeTab === 'hardware' && <HardwareView />}
                    </div>
                    <div className='bg-crimson-600 overflow-x-hidden py-2 text-white' onClick={() => OpenBrowser('https://superpc.vn')}>
                        <div className='animate-marquee flex items-center gap-2 text-sm font-medium whitespace-nowrap'>
                            <span>SUPERPC.VN - Cung cấp giải pháp toàn diện cho Game Net</span>
                            <span className='mx-2'>•</span>
                            <IconDevicesPc size={18} stroke={2} className='shrink-0' />
                            <span>Máy tính Gaming cao cấp</span>
                            <span className='mx-2'>•</span>
                            <IconDeviceDesktop size={18} stroke={2} className='shrink-0' />
                            <span>Máy văn phòng chuyên nghiệp</span>
                            <span className='mx-2'>•</span>
                            <IconDeviceComputerCamera size={18} stroke={2} className='shrink-0' />
                            <span>Camera giám sát an ninh</span>
                            <span className='mx-2'>•</span>
                            <IconPhone size={18} stroke={2} className='shrink-0' />
                            <span>Liên hệ: 0983.281.087 - 0399.081.089</span>
                            <span className='mx-2'>•</span>
                            <IconHeadset size={18} stroke={2} className='shrink-0' />
                            <span>Tư vấn miễn phí 24/7</span>
                            <span className='mx-2'>•</span>
                            <IconTir size={18} stroke={2} className='shrink-0' />
                            <span>Giao hàng toàn quốc</span>
                            <span className='mx-2'>•</span>
                            <IconReceiptRefund size={18} stroke={2} className='shrink-0' />
                            <span>Bảo hành chính hãng</span>
                        </div>
                    </div>
                </main>
            </div>
            {showCreditModal && <CreditModal onClose={() => setShowCreditModal(false)} />}
        </div>
    );
};

export default App;
