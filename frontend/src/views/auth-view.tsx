import LogoImage from '@/assets/images/logo-full.png';
import LoginTab from '@/views/auth-tab/login-tab';
import RegisterTab from '@/views/auth-tab/register-tab';
import { IconBuilding, IconDeviceComputerCamera, IconDeviceDesktop, IconMail, IconShieldCheck } from '@tabler/icons-react';
import { OpenBrowser } from '@wails/go/main/App';
import type { FC } from 'react';
import { useState } from 'react';
type TabType = 'login' | 'register';

const AuthView: FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('login');
    return (
        <div className='flex h-full w-full overflow-hidden bg-stone-100'>
            <div className='flex w-85 flex-col border-r border-stone-200 bg-stone-50 p-6'>
                <div onClick={() => OpenBrowser('https://superpc.vn')} className='mb-6 cursor-pointer'>
                    <div className='flex flex-col items-center gap-3 rounded border border-stone-200 bg-white p-4'>
                        <img src={LogoImage} alt='SuperPC' className='w-4/5 object-contain' />
                        <p className='text-center text-sm font-medium text-stone-600'>Giải pháp toàn diện cho Game Net</p>
                    </div>
                </div>

                <div className='mb-6 flex-1 space-y-3'>
                    <p className='text-xs font-semibold text-stone-700'>Sản phẩm & Dịch vụ</p>

                    <div className='space-y-2 text-xs'>
                        <div className='flex items-start gap-2 rounded border border-stone-200 bg-white p-3'>
                            <IconDeviceDesktop size={16} className='text-crimson-600 mt-0.5 shrink-0' stroke={1.5} />
                            <div>
                                <p className='font-semibold text-stone-800'>PC Gaming & Văn phòng</p>
                                <p className='text-[11px] text-stone-600'>Cấu hình theo nhu cầu, giá ưu đãi</p>
                            </div>
                        </div>

                        <div className='flex items-start gap-2 rounded border border-stone-200 bg-white p-3'>
                            <IconBuilding size={16} className='text-crimson-600 mt-0.5 shrink-0' stroke={1.5} />
                            <div>
                                <p className='font-semibold text-stone-800'>Lắp đặt phòng Game Net</p>
                                <p className='text-[11px] text-stone-600'>Tư vấn thiết kế & thi công trọn gói</p>
                            </div>
                        </div>

                        <div className='flex items-start gap-2 rounded border border-stone-200 bg-white p-3'>
                            <IconShieldCheck size={16} className='text-crimson-600 mt-0.5 shrink-0' stroke={1.5} />
                            <div>
                                <p className='font-semibold text-stone-800'>Bảo hành tận nhà</p>
                                <p className='text-[11px] text-stone-600'>Sửa chữa & bảo trì chuyên nghiệp</p>
                            </div>
                        </div>

                        <div className='flex items-start gap-2 rounded border border-stone-200 bg-white p-3'>
                            <IconDeviceComputerCamera size={16} className='text-crimson-600 mt-0.5 shrink-0' stroke={1.5} />
                            <div>
                                <p className='font-semibold text-stone-800'>Camera giám sát</p>
                                <p className='text-[11px] text-stone-600'>Lắp đặt & cấu hình hệ thống camera</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className='space-y-3 rounded border border-stone-200 bg-white p-4'>
                    <div className='text-center'>
                        <button className='text-[10px] font-semibold tracking-wide text-stone-500 uppercase' onClick={() => OpenBrowser('zalo://conversation?phone=0399081089')}>
                            Tư vấn miễn phí: 0399.081.089
                        </button>
                        <div className='mt-1 space-y-0.5'></div>
                    </div>

                    <div className='space-y-1.5 border-t border-stone-200 pt-3 text-[11px] text-stone-600'>
                        <div className='flex items-center gap-1.5'>
                            <IconMail size={11} className='text-crimson-600' stroke={1.5} />
                            <span>superpc.vnn@gmail.com</span>
                        </div>
                        <div className='flex items-start gap-1.5'>
                            <IconBuilding size={11} className='text-crimson-600 mt-0.5' stroke={1.5} />
                            <span className='leading-tight'>Số 4, Ngõ 364 Giải Phóng, Định Công, Hà Nội</span>
                        </div>
                    </div>

                    <button onClick={() => OpenBrowser('https://superpc.vn')} className='bg-crimson-600 w-full rounded py-2 text-xs font-semibold text-white'>
                        Xem sản phẩm tại superpc.vn
                    </button>
                </div>
            </div>

            <div className='flex flex-1 items-center justify-center bg-stone-50 p-12'>
                <div className='w-full max-w-md'>
                    <div className='mb-6 flex gap-2 rounded-lg border border-stone-200 bg-white p-1'>
                        <button onClick={() => setActiveTab('login')} className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${activeTab === 'login' ? 'bg-crimson-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-800'}`}>
                            Đăng nhập
                        </button>
                        <button onClick={() => setActiveTab('register')} className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${activeTab === 'register' ? 'bg-crimson-600 text-white shadow-sm' : 'text-stone-600 hover:text-stone-800'}`}>
                            Đăng ký
                        </button>
                    </div>

                    <div className='rounded-lg border border-stone-200 bg-white p-6'>
                        {activeTab === 'login' && <LoginTab />}
                        {activeTab === 'register' && <RegisterTab />}
                    </div>

                    <div className='mt-4 text-center text-xs text-stone-500'>
                        Zalo Support:{' '}
                        <span className='text-crimson-600 hover:text-crimson-700 cursor-pointer font-medium transition-colors' onClick={() => OpenBrowser('zalo://conversation?phone=0983281087')}>
                            0983.281.087
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthView;
