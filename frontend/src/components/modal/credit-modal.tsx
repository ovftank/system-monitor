import ovfteamLogo from '@/assets/images/ovfteam-logo.png';
import { IconDownload, IconLoader2, IconX } from '@tabler/icons-react';
import { CheckForUpdates, DownloadUpdate, GetAppInfo, InstallUpdate, OpenBrowser } from '@wails/go/main/App';
import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface CreditModalProps {
    onClose: () => void;
}

interface AppInfo {
    companyName: string;
    productName: string;
    productVersion: string;
    copyright: string;
    comments: string;
}

const CreditModal: FC<CreditModalProps> = ({ onClose }) => {
    const [appInfo, setAppInfo] = useState<AppInfo | null>(null);
    const [updateAvailable, setUpdateAvailable] = useState(false);
    const [newVersion, setNewVersion] = useState<string>('');
    const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isInstalling, setIsInstalling] = useState(false);
    const [updateMessage, setUpdateMessage] = useState('');

    useEffect(() => {
        const fetchAppInfo = async () => {
            const info = await GetAppInfo();
            console.log(info);
            setAppInfo(info);
        };
        fetchAppInfo();
    }, []);

    const checkForUpdates = async () => {
        setIsCheckingUpdate(true);
        setUpdateMessage('');
        try {
            const result = await CheckForUpdates();

            if (result.error) {
                setUpdateMessage('Lỗi khi kiểm tra.');
                return;
            }

            if (result.hasUpdate) {
                setUpdateAvailable(true);
                setNewVersion(result.newVersion);
                setUpdateMessage(`Có phiên bản v${result.newVersion}, cập nhật ngay?`);
            } else {
                setUpdateAvailable(false);
                setUpdateMessage('Đang dùng phiên bản mới nhất.');
            }
        } catch {
            setUpdateMessage('Lỗi khi kiểm tra.');
        } finally {
            setIsCheckingUpdate(false);
        }
    };

    const downloadAndInstall = async () => {
        if (!updateAvailable || !newVersion) return;

        setIsDownloading(true);
        setUpdateMessage('Đang tải xuống ...');

        try {
            const setupPath = await DownloadUpdate(newVersion);
            setIsDownloading(false);
            setIsInstalling(true);
            setUpdateMessage('Đang cài đặt ...');

            await InstallUpdate(setupPath);
        } catch {
            setIsDownloading(false);
            setIsInstalling(false);
            setUpdateMessage('Cập nhật thất bại.');
        }
    };
    return (
        <div className='fixed top-10 right-0 bottom-0 left-0 z-50 flex items-center justify-center bg-black/50'>
            <div className='w-96 rounded-lg border border-stone-300 bg-white shadow-xl'>
                <div className='flex items-center justify-between rounded-t-lg border-b border-stone-200 bg-stone-50 px-5 py-4'>
                    <p className='text-sm font-semibold text-stone-900'>Thông tin</p>
                    <button onClick={onClose} className='p-0 text-stone-600 transition-colors hover:text-stone-900'>
                        <IconX size={18} />
                    </button>
                </div>

                <div className='space-y-4 px-5 py-5'>
                    <div className='flex items-center justify-center'>
                        <img src={ovfteamLogo} alt='ovfteam' className='h-16 w-auto' />
                    </div>

                    <div className='text-center'>
                        <div className='flex items-center justify-center gap-2'>
                            <p className='text-base font-semibold text-stone-900'>{appInfo?.productName || 'System Monitor'}</p>
                            {appInfo?.productVersion && <p className='text-xs text-stone-500'>v{appInfo.productVersion}</p>}
                        </div>
                    </div>

                    <div className='space-y-3 border-t border-stone-200 pt-4'>
                        <div className='space-y-3'>
                            {!isCheckingUpdate && !isDownloading && !isInstalling && (
                                <button onClick={checkForUpdates} className='w-full rounded-md border border-stone-300 bg-stone-50 px-3 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100 disabled:opacity-50' disabled={isCheckingUpdate || isDownloading || isInstalling}>
                                    Kiểm tra cập nhật
                                </button>
                            )}

                            {(isCheckingUpdate || isDownloading || isInstalling) && (
                                <div className='flex items-center justify-center gap-2 rounded-md border border-stone-300 bg-stone-50 px-3 py-2'>
                                    <IconLoader2 className='animate-spin' size={16} />
                                    <span className='text-sm font-medium text-stone-700'>
                                        {isCheckingUpdate && 'Đang kiểm tra...'}
                                        {isDownloading && 'Đang tải xuống...'}
                                        {isInstalling && 'Đang cài đặt...'}
                                    </span>
                                </div>
                            )}

                            {updateAvailable && !isDownloading && !isInstalling && (
                                <button onClick={downloadAndInstall} className='flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50' disabled={isDownloading || isInstalling}>
                                    <IconDownload size={16} />
                                    Cập nhật lên v{newVersion}
                                </button>
                            )}

                            {updateMessage && (
                                <div className='text-center'>
                                    <p className={`text-sm ${updateAvailable && !updateMessage.includes('thất bại') ? 'text-blue-600' : 'text-stone-600'}`}>{updateMessage}</p>
                                </div>
                            )}
                        </div>

                        {appInfo?.comments && (
                            <div className='text-center'>
                                <p className='text-sm text-stone-700'>
                                    <button
                                        onClick={() => {
                                            OpenBrowser('https://ovfteam.com/');
                                        }}
                                    >
                                        {appInfo.comments}
                                    </button>
                                </p>
                            </div>
                        )}
                        <div className='text-center'>
                            <p className='text-xs text-stone-500'>{appInfo?.copyright || 'Copyright © SuperPC'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreditModal;
