import API_ENDPOINTS from '@/const/api-endpoint';
import { useAuthStore } from '@/stores/authStore';
import type { FC } from 'react';
import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface User {
    id: number;
    username: string;
    password: string;
    hwid: string | null;
    status: number;
    license_expire: number;
}

interface EditAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User | null;
    onAccountUpdated?: (user: User) => void;
}

const EditAccountModal: FC<EditAccountModalProps> = ({ isOpen, onClose, user, onAccountUpdated }) => {
    const { token } = useAuthStore();
    const usernameRef = useRef<HTMLInputElement>(null);
    const passwordRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && user) {
            if (usernameRef.current) usernameRef.current.value = user.username;
            if (passwordRef.current) passwordRef.current.value = user.password;
        }
    }, [isOpen, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast.error('Không tìm thấy tài khoản');
            return;
        }

        const username = usernameRef.current?.value || '';
        const password = passwordRef.current?.value || '';

        if (!username.trim()) {
            toast.error('Username không được để trống');
            return;
        }

        if (!password.trim()) {
            toast.error('Mật khẩu không được để trống');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.USERS.UPDATE_ACCOUNT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: user.id,
                    username,
                    password
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                if (onAccountUpdated) {
                    onAccountUpdated({
                        ...user,
                        username,
                        password
                    });
                }
                onClose();
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(`Lỗi: ${err}`);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen || !user) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
            <div className='absolute inset-0 bg-stone-900/50 backdrop-blur-sm' onClick={onClose} />
            <div className='relative mx-4 w-full max-w-md rounded-lg border border-stone-300 bg-white p-4 shadow-xl'>
                <div className='mb-4'>
                    <p className='text-lg font-medium text-stone-900'>Sửa thông tin</p>
                    <p className='text-sm text-stone-600'>ID: {user.id}</p>
                </div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <p className='mb-1 text-sm font-medium text-stone-700'>Username</p>
                        <input type='text' ref={usernameRef} placeholder='Nhập username' className='w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 transition-colors focus:border-stone-500 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50' disabled={loading} required />
                    </div>

                    <div>
                        <p className='mb-1 text-sm font-medium text-stone-700'>Mật khẩu</p>
                        <input type='text' ref={passwordRef} placeholder='Nhập mật khẩu' className='w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 transition-colors focus:border-stone-500 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50' disabled={loading} required />
                    </div>

                    <div className='flex gap-3 pt-2'>
                        <button type='button' onClick={onClose} disabled={loading} className='flex-1 rounded-lg border border-stone-300 px-4 py-2 font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                            Hủy
                        </button>
                        <button type='submit' disabled={loading} className='flex-1 rounded-lg bg-stone-600 px-4 py-2 font-medium text-white transition-colors hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                            {loading ? 'Đang xử lý...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditAccountModal;
