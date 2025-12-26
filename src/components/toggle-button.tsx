import API_ENDPOINTS from '@/const/api-endpoint';
import { useAuthStore } from '@/stores/authStore';
import type { FC } from 'react';
import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

interface ToggleButtonProps {
    userId: number;
    currentStatus: number;
    onStatusChange?: (userId: number, newStatus: number) => void;
}

const ToggleButton: FC<ToggleButtonProps> = ({ userId, currentStatus, onStatusChange }) => {
    const { token } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [optimisticStatus, setOptimisticStatus] = useState(currentStatus);

    const handleToggle = useCallback(async () => {
        if (!token || loading) return;

        const newStatus = currentStatus === 1 ? 0 : 1;

        setOptimisticStatus(newStatus);
        setLoading(true);

        try {
            const response = await fetch(API_ENDPOINTS.USERS.TOGGLE_STATUS, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ user_id: userId })
            });

            const data = await response.json();

            if (data.success) {
                if (onStatusChange) {
                    onStatusChange(userId, data.data.new_status);
                }
                toast.success(data.message);
            } else {
                setOptimisticStatus(currentStatus);
                toast.error(data.message);
            }
        } catch (err) {
            setOptimisticStatus(currentStatus);
            toast.error(`Lỗi: ${err}`);
        } finally {
            setLoading(false);
        }
    }, [token, loading, currentStatus, userId, onStatusChange]);

    const isActive = optimisticStatus === 1;

    return (
        <button onClick={handleToggle} disabled={loading} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all duration-300 ease-out focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none ${isActive ? 'bg-stone-600' : 'bg-stone-300'} ${loading ? 'scale-95 opacity-70' : ''} transform`}>
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-all duration-300 ease-out ${isActive ? 'translate-x-6' : 'translate-x-1'} ${loading ? 'scale-90 animate-pulse' : ''} `} />

            {loading && (
                <div className='absolute inset-0 flex items-center justify-center'>
                    <div className='h-2 w-2 animate-bounce rounded-full bg-stone-400' />
                </div>
            )}
        </button>
    );
};

export default ToggleButton;
