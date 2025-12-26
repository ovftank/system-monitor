import API_ENDPOINTS from '@/const/api-endpoint';
import { useAuthStore } from '@/stores/authStore';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

const Login = () => {
    const { login } = useAuthStore();
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const username = usernameRef.current?.value || '';
        const password = passwordRef.current?.value || '';

        if (!username.trim() || !password.trim()) {
            toast.error('Không hợp lệ');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                if (data.data?.token) {
                    login(data.data.token);
                }
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(`Lỗi: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className='flex flex-col items-center space-y-6'>
            <form onSubmit={handleSubmit} className='w-80 space-y-4'>
                <input type='text' ref={usernameRef} placeholder='Tên đăng nhập' className='w-full rounded border border-stone-300 px-3 py-2' disabled={loading} autoFocus required />
                <input type='password' ref={passwordRef} placeholder='Mật khẩu' className='w-full rounded border border-stone-300 px-3 py-2' disabled={loading} required />
                <button type='submit' disabled={loading} className='w-full rounded bg-stone-600 px-4 py-2 text-stone-50 disabled:opacity-50'>
                    {loading ? 'Đang xử lý...' : 'Đăng nhập'}
                </button>
            </form>
        </div>
    );
};

export default Login;
