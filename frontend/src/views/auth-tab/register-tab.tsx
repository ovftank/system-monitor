import { Register } from '@wails/go/main/App';
import type { FC } from 'react';
import { useState } from 'react';

const RegisterTab: FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleRegister = async () => {
        setError('');
        setSuccess('');

        if (!username.trim()) {
            setError('Chưa nhập tài khoản');
            return;
        }
        if (!password) {
            setError('Chưa nhập mật khẩu');
            return;
        }
        if (password !== passwordConfirm) {
            setError('Mật khẩu không khớp');
            return;
        }
        if (password.length < 6) {
            setError('Mật khẩu quá ngắn');
            return;
        }

        setLoading(true);

        try {
            const response = await Register(username.trim(), password);

            if (response?.success) {
                setSuccess(response.message);
                setUsername('');
                setPassword('');
                setPasswordConfirm('');
                return;
            }

            if (response?.message) {
                setError(response.message);
            } else if (response === null || response === undefined) {
                setError('Lỗi không xác định');
            } else {
                setError('Lỗi không xác định');
            }
        } catch {
            setError('Lỗi không xác định');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleRegister();
        }
    };

    return (
        <div className='space-y-4'>
            {error && <div className='border-crimson-200 bg-crimson-50 text-crimson-700 rounded border p-2 text-xs'>{error}</div>}
            {success && <div className='rounded border border-green-200 bg-green-50 p-2 text-xs whitespace-pre-line text-green-700'>{success}</div>}
            <div className='space-y-3'>
                <div>
                    <p className='mb-1.5 text-xs font-medium text-stone-700'>Tên đăng nhập</p>
                    <input type='text' value={username} onChange={(e) => setUsername(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} placeholder='Nhập tên đăng nhập' className='focus:ring-crimson-600 focus:border-crimson-600 w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:outline-none disabled:bg-stone-50' />
                </div>

                <div>
                    <p className='mb-1.5 text-xs font-medium text-stone-700'>Mật khẩu</p>
                    <input type='password' value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} placeholder='Nhập mật khẩu' className='focus:ring-crimson-600 focus:border-crimson-600 w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:outline-none disabled:bg-stone-50' />
                </div>

                <div>
                    <p className='mb-1.5 text-xs font-medium text-stone-700'>Xác nhận mật khẩu</p>
                    <input type='password' value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} onKeyDown={handleKeyDown} disabled={loading} placeholder='Xác nhận mật khẩu' className='focus:ring-crimson-600 focus:border-crimson-600 w-full rounded border border-stone-300 px-3 py-2 text-sm text-stone-900 placeholder-stone-400 focus:ring-1 focus:outline-none disabled:bg-stone-50' />
                </div>
            </div>

            <button onClick={handleRegister} disabled={loading} className='bg-crimson-600 disabled:bg-crimson-400 w-full rounded px-3 py-2 text-sm font-medium text-white'>
                {loading ? 'Đang đăng ký...' : 'Đăng ký'}
            </button>
        </div>
    );
};

export default RegisterTab;
