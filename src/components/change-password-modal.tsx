import API_ENDPOINTS from '@/const/api-endpoint';
import { useAuthStore } from '@/stores/authStore';
import type { FC } from 'react';
import { useRef, useState } from 'react';
import toast from 'react-hot-toast';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const ChangePasswordModal: FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
    const { token } = useAuthStore();
    const newPasswordRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newPassword = newPasswordRef.current?.value || '';

        if (!newPassword.trim()) {
            toast.error('Mật khẩu mới không được để trống');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    new_password: newPassword
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
                onClose();
                if (newPasswordRef.current) {
                    newPasswordRef.current.value = '';
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

    if (!isOpen) return null;

    return (
        <div className='fixed inset-0 z-50 flex items-center justify-center'>
            <div className='absolute inset-0 bg-stone-900/50 backdrop-blur-sm' onClick={onClose} />
            <div className='relative mx-4 w-full max-w-md rounded-lg border border-stone-300 bg-white p-4 shadow-xl'>
                <div className='mb-4'>
                    <p className='text-lg font-medium text-stone-900'>Đổi mật khẩu</p>
                </div>

                <form onSubmit={handleSubmit} className='space-y-4'>
                    <div>
                        <input type='password' ref={newPasswordRef} placeholder='Mật khẩu mới' className='w-full rounded-lg border border-stone-300 px-3 py-2 text-stone-900 placeholder-stone-400 transition-colors focus:border-stone-500 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50' disabled={loading} required />
                    </div>

                    <div className='flex gap-3 pt-2'>
                        <button type='button' onClick={onClose} disabled={loading} className='flex-1 rounded-lg border border-stone-300 px-4 py-2 font-medium text-stone-700 transition-colors hover:bg-stone-50 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                            Hủy
                        </button>
                        <button type='submit' disabled={loading} className='flex-1 rounded-lg bg-stone-600 px-4 py-2 font-medium text-white transition-colors hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50'>
                            {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
