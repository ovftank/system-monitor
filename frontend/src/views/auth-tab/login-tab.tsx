import { Login } from '@wails/go/main/App';
import type { FC } from 'react';
import { useState } from 'react';

const LoginTab: FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async () => {
        setError('');

        if (!username.trim()) {
            setError('Chưa nhập tài khoản');
            return;
        }
        if (!password) {
            setError('Chưa nhập mật khẩu');
            return;
        }

        setLoading(true);

        try {
            const response = await Login(username.trim(), password);
            if (response?.status === 'success' && response.token) {
                localStorage.setItem('authToken', response.token);
                window.location.reload();
            } else {
                setError(response?.message || 'Đăng nhập thất bại');
            }
        } catch {
            setError('Đăng nhập thất bại');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleLogin();
        }
    };

    return (
        <div className='space-y-4'>
            {error && <p className='text-sm text-red-600'>{error}</p>}
            <div className='space-y-3'>
                <div>
                    <p className='mb-1.5 text-xs font-medium text-stone-700'>Tên đăng nhập</p>
                    <input type='text' value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} placeholder='Nhập tên đăng nhập' className='focus:ring-crimson-600 focus:border-crimson-600 w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50' />
                </div>

                <div>
                    <p className='mb-1.5 text-xs font-medium text-stone-700'>Mật khẩu</p>
                    <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} placeholder='Nhập mật khẩu' className='focus:ring-crimson-600 focus:border-crimson-600 w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:outline-none disabled:cursor-not-allowed disabled:bg-stone-50' />
                </div>
            </div>

            <button onClick={handleLogin} disabled={loading} className='bg-crimson-600 hover:bg-crimson-700 disabled:bg-crimson-400 w-full rounded px-3 py-2 text-xs font-medium text-white transition-colors disabled:cursor-not-allowed'>
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
        </div>
    );
};

export default LoginTab;
