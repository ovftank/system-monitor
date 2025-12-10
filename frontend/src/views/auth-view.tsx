import LoginTab from '@/views/auth-tab/login-tab';
import RegisterTab from '@/views/auth-tab/register-tab';
import type { FC } from 'react';
import { useState } from 'react';
type TabType = 'login' | 'register';

const AuthView: FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('login');
    return (
        <div className='flex min-h-screen w-screen items-center justify-center bg-white'>
            <div className='w-96 rounded-lg border border-stone-300 bg-white shadow-xl'>
                <div className='flex border-b border-stone-200'>
                    <button onClick={() => setActiveTab('login')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'login' ? 'text-crimson-600 border-crimson-600 -mb-px border-b-2' : 'text-stone-600 hover:text-stone-900'}`}>
                        Đăng nhập
                    </button>
                    <button onClick={() => setActiveTab('register')} className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'register' ? 'text-crimson-600 border-crimson-600 -mb-px border-b-2' : 'text-stone-600 hover:text-stone-900'}`}>
                        Đăng ký
                    </button>
                </div>

                <div className='px-5 py-4'>
                    {activeTab === 'login' && <LoginTab />}
                    {activeTab === 'register' && <RegisterTab />}
                </div>
            </div>
        </div>
    );
};

export default AuthView;
