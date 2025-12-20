import FloatingInfo from '@/components/floating-info';
import API_ENDPOINTS from '@/const/api-endpoint';
import Dashboard from '@/pages/dashboard';
import Login from '@/pages/login';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, type FC } from 'react';
import { Toaster } from 'react-hot-toast';

const App: FC = () => {
    const { isAuthenticated, token, logout } = useAuthStore();

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) return;

            try {
                const response = await fetch(API_ENDPOINTS.AUTH.VERIFY_TOKEN, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    },
                    body: JSON.stringify({ token })
                });

                const data = await response.json();

                if (!data.success) {
                    logout();
                }
            } catch {
                logout();
            }
        };

        verifyToken();
    }, [token, logout]);

    return (
        <>
            <main className='hidden min-h-screen flex-col items-center justify-center bg-stone-50 sm:flex'>{isAuthenticated ? <Dashboard /> : <Login />}</main>
            <FloatingInfo />
            <Toaster
                position='top-right'
                toastOptions={{
                    duration: 4000,
                    style: {
                        background: '#f5f5f4',
                        color: '#1c1917',
                        border: '1px solid #d6d3d1'
                    },
                    success: {
                        iconTheme: {
                            primary: '#78716c',
                            secondary: '#f5f5f4'
                        }
                    },
                    error: {
                        iconTheme: {
                            primary: '#78716c',
                            secondary: '#f5f5f4'
                        }
                    }
                }}
            />
        </>
    );
};

export default App;
