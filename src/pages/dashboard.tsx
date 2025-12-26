import ChangePasswordModal from '@/components/change-password-modal';
import CreateAccountModal from '@/components/create-account-modal';
import EditAccountModal from '@/components/edit-account-modal';
import LicenseExpirePicker from '@/components/license-expire-picker';
import ToggleButton from '@/components/toggle-button';
import API_ENDPOINTS from '@/const/api-endpoint';
import { useAuthStore } from '@/stores/authStore';
import { faEdit, faKey, faPlus, faRefresh, faRightFromBracket, faSearch, faSort, faSortDown, faSortUp, faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
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

interface UsersResponse {
    success: boolean;
    message: string;
    data: {
        users: User[];
        total: number;
    } | null;
}

type SortField = 'id' | 'username' | 'license_expire';

const Dashboard: FC = () => {
    const { token, logout } = useAuthStore();
    const [users, setUsers] = useState<User[]>([]);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [sortField, setSortField] = useState<SortField>('id');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [statusColumnWidth, setStatusColumnWidth] = useState<string>('auto');
    const [changePasswordModal, setChangePasswordModal] = useState<{ isOpen: boolean }>({
        isOpen: false
    });
    const [createAccountModal, setCreateAccountModal] = useState<{ isOpen: boolean }>({
        isOpen: false
    });
    const [editAccountModal, setEditAccountModal] = useState<{ isOpen: boolean; user: User | null }>({
        isOpen: false,
        user: null
    });
    const statusHeaderRef = useRef<HTMLTableCellElement>(null);
    const toggleButtonRef = useRef<HTMLButtonElement>(null);
    const editButtonRef = useRef<HTMLButtonElement>(null);
    const deleteButtonRef = useRef<HTMLButtonElement>(null);

    const handleStatusChange = (userId: number, newStatus: number) => {
        setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, status: newStatus } : user)));
    };

    const handleLicenseExpireChange = async (userId: number, newTimestamp: number) => {
        if (!token) {
            toast.error('Token không hợp lệ');
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.USERS.UPDATE_LICENSE_EXPIRE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: userId,
                    license_expire: newTimestamp
                })
            });

            const data = await response.json();

            if (data.success) {
                setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, license_expire: newTimestamp } : user)));
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(`Lỗi: ${err}`);
        }
    };

    const handleResetHWID = async (userId: number) => {
        if (!token) {
            toast.error('Token không hợp lệ');
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.USERS.RESET_HWID, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: userId
                })
            });

            const data = await response.json();

            if (data.success) {
                setUsers((prevUsers) => prevUsers.map((user) => (user.id === userId ? { ...user, hwid: null } : user)));
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(`Lỗi: ${err}`);
        }
    };

    const handleDeleteAccount = async (userId: number, username: string) => {
        if (!token) {
            toast.error('Token không hợp lệ');
            return;
        }

        if (!window.confirm(`Bạn có chắc chắn muốn xóa tài khoản "${username}"?`)) {
            return;
        }

        try {
            const response = await fetch(API_ENDPOINTS.USERS.DELETE_ACCOUNT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    user_id: userId
                })
            });

            const data = await response.json();

            if (data.success) {
                setUsers((prevUsers) => prevUsers.filter((user) => user.id !== userId));
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (err) {
            toast.error(`Lỗi: ${err}`);
        }
    };

    const handleSearch = (term: string) => {
        setSearchTerm(term);
    };

    const handleOpenChangePasswordModal = () => {
        setChangePasswordModal({
            isOpen: true
        });
    };

    const handleCloseChangePasswordModal = () => {
        setChangePasswordModal({
            isOpen: false
        });
    };

    const handleOpenCreateAccountModal = () => {
        setCreateAccountModal({
            isOpen: true
        });
    };

    const handleCloseCreateAccountModal = () => {
        setCreateAccountModal({
            isOpen: false
        });
    };

    const handleAccountCreated = (newUser: User) => {
        setUsers((prevUsers) => [newUser, ...prevUsers]);
    };

    const handleOpenEditAccountModal = (user: User) => {
        setEditAccountModal({
            isOpen: true,
            user
        });
    };

    const handleCloseEditAccountModal = () => {
        setEditAccountModal({
            isOpen: false,
            user: null
        });
    };

    const handleAccountUpdated = (updatedUser: User) => {
        setUsers((prevUsers) => prevUsers.map((user) => (user.id === updatedUser.id ? updatedUser : user)));
    };

    const handleLogout = () => {
        logout();
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    const getSortIcon = (field: SortField) => {
        if (sortField !== field) {
            return faSort;
        }
        return sortOrder === 'asc' ? faSortUp : faSortDown;
    };

    useEffect(() => {
        const updateStatusColumnWidth = () => {
            if (toggleButtonRef.current && editButtonRef.current && deleteButtonRef.current && statusHeaderRef.current) {
                const toggleWidth = toggleButtonRef.current.offsetWidth;
                const editWidth = editButtonRef.current.offsetWidth;
                const deleteWidth = deleteButtonRef.current.offsetWidth;
                const gap = 8; // gap-2 = 0.5rem = 8px, có 2 gaps giữa 3 buttons
                const calculatedWidth = toggleWidth + editWidth + deleteWidth + gap * 2 + 32; // 32 = padding (px-4)
                setStatusColumnWidth(`${calculatedWidth}px`);
            }
        };

        updateStatusColumnWidth();

        const handleResize = () => {
            updateStatusColumnWidth();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [users.length]);

    const filteredUsers = users.filter((user) => {
        if (!searchTerm) return true;

        const term = searchTerm.toLowerCase();

        return user.username.toLowerCase().includes(term) || user.hwid?.toLowerCase().includes(term);
    });

    const sortedUsers = [...filteredUsers].sort((a, b) => {
        let aValue: string | number;
        let bValue: string | number;

        switch (sortField) {
            case 'id':
                aValue = a.id;
                bValue = b.id;
                break;
            case 'username':
                aValue = a.username.toLowerCase();
                bValue = b.username.toLowerCase();
                break;
            case 'license_expire':
                aValue = a.license_expire;
                bValue = b.license_expire;
                break;
            default:
                return 0;
        }

        if (aValue < bValue) {
            return sortOrder === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
            return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
    });

    useEffect(() => {
        const fetchUsers = async () => {
            if (!token) {
                toast.error('Token không hợp lệ');
                return;
            }

            try {
                const response = await fetch(API_ENDPOINTS.USERS.GET_LIST, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`
                    }
                });

                const data: UsersResponse = await response.json();

                if (data.success && data.data) {
                    setUsers(data.data.users);
                    toast.success(data.message);
                } else {
                    toast.error(data.message);
                }
            } catch (err) {
                toast.error(`Lỗi: ${err}`);
            }
        };

        fetchUsers();
    }, [token]);

    return (
        <main className='flex h-screen w-full flex-col p-4'>
            <div className='absolute -left-full' style={{ visibility: 'hidden' }}>
                <button ref={toggleButtonRef} className='relative inline-flex h-6 w-11 items-center rounded-full bg-stone-600'>
                    <span className='inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white' />
                </button>
                <button ref={editButtonRef} className='rounded p-1.5'>
                    <FontAwesomeIcon icon={faEdit} className='h-3.5 w-3.5' />
                </button>
                <button ref={deleteButtonRef} className='rounded p-1.5'>
                    <FontAwesomeIcon icon={faTrash} className='h-3.5 w-3.5' />
                </button>
            </div>

            <div className='flex min-h-0 w-full flex-1 flex-col space-y-6'>
                <div className='flex items-center justify-between rounded-lg border border-stone-200 bg-stone-100 p-4'>
                    <div className='flex items-center gap-2'>
                        <p className='font-medium text-stone-700'>Tổng số: {users.length} người dùng</p>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button onClick={handleOpenChangePasswordModal} className='flex items-center gap-2 rounded-lg bg-stone-600 px-4 py-2 text-white transition-colors hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none' title='Đổi mk'>
                            <FontAwesomeIcon icon={faKey} className='h-4 w-4' />
                            <span>Đổi MK</span>
                        </button>
                        <button onClick={handleLogout} className='flex items-center gap-2 rounded-lg bg-stone-600 px-4 py-2 text-white transition-colors hover:bg-stone-700 focus:ring-2 focus:ring-stone-500 focus:ring-offset-2 focus:outline-none' title='Đăng xuất'>
                            <FontAwesomeIcon icon={faRightFromBracket} className='h-4 w-4' />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>

                <div className='flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-100 px-4 py-3'>
                    <div className='flex items-center gap-2 text-stone-600'>
                        <FontAwesomeIcon icon={faSearch} className='h-4 w-4' />
                        <p className='text-sm font-medium'>Tìm kiếm:</p>
                    </div>
                    <input type='text' value={searchTerm} onChange={(e) => handleSearch(e.target.value)} placeholder='Tìm kiếm theo User, HWID...' className='flex-1 rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 focus:border-stone-500 focus:ring-2 focus:ring-stone-500 focus:outline-none' />
                    <button onClick={handleOpenCreateAccountModal} className='rounded border border-stone-300 bg-white px-3 py-1.5 text-sm text-stone-700 transition-colors hover:bg-stone-50 focus:border-stone-500 focus:ring-2 focus:ring-stone-500 focus:outline-none' title='Tạo tài khoản mới'>
                        <FontAwesomeIcon icon={faPlus} className='h-4 w-4' />
                        <span className='ml-1'>Tạo TK</span>
                    </button>
                </div>
                <div className='relative flex-1 overflow-y-auto rounded-lg border border-stone-200'>
                    <table className='w-full border-collapse rounded-lg'>
                        <thead>
                            <tr className='rounded-t-lg bg-stone-100'>
                                <th className='sticky top-0 z-10 border border-stone-300 bg-stone-100 px-4 py-3 text-left font-medium text-stone-600'>
                                    <button onClick={() => handleSort('id')} className='flex w-full items-center justify-between transition-colors hover:text-stone-600'>
                                        <span>ID</span>
                                        <FontAwesomeIcon icon={getSortIcon('id')} className='ml-2 h-3 w-3' />
                                    </button>
                                </th>
                                <th className='sticky top-0 z-10 border border-stone-300 bg-stone-100 px-4 py-3 text-left font-medium text-stone-600'>
                                    <button onClick={() => handleSort('username')} className='flex w-full items-center justify-between transition-colors hover:text-stone-600'>
                                        <span>TK</span>
                                        <FontAwesomeIcon icon={getSortIcon('username')} className='ml-2 h-3 w-3' />
                                    </button>
                                </th>
                                <th className='sticky top-0 z-10 border border-stone-300 bg-stone-100 px-4 py-3 text-left font-medium text-stone-600'>MK</th>
                                <th className='sticky top-0 z-10 border border-stone-300 bg-stone-100 px-4 py-3 text-left font-medium text-stone-600'>HWID</th>
                                <th className='sticky top-0 z-10 border border-stone-300 bg-stone-100 px-4 py-3 text-left font-medium text-stone-600'>
                                    <button onClick={() => handleSort('license_expire')} className='flex w-full items-center justify-between transition-colors hover:text-stone-600'>
                                        <span>Ngày hết hạn</span>
                                        <FontAwesomeIcon icon={getSortIcon('license_expire')} className='ml-2 h-3 w-3' />
                                    </button>
                                </th>
                                <th ref={statusHeaderRef} className='sticky top-0 z-10 border border-stone-300 bg-stone-100 px-4 py-3 text-center font-medium whitespace-nowrap text-stone-600' style={{ width: statusColumnWidth }}>
                                    Hành động
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedUsers.map((user) => (
                                <tr key={user.id} className='transition-colors hover:bg-stone-50'>
                                    <td className='border border-stone-300 px-4 py-3 font-medium text-stone-600'>{user.id}</td>
                                    <td className='border border-stone-300 px-4 py-3 text-stone-600'>{user.username}</td>
                                    <td className='border border-stone-300 px-4 py-3 font-mono text-sm text-stone-600'>{user.password}</td>
                                    <td className='border border-stone-300 px-4 py-3 font-mono text-sm text-stone-600'>
                                        <div className='flex items-center justify-between'>
                                            <span className='flex-1 truncate'>{user.hwid || 'N/A'}</span>
                                            {user.hwid && (
                                                <button onClick={() => handleResetHWID(user.id)} className='ml-2 rounded p-1 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600' title='Reset HWID'>
                                                    <FontAwesomeIcon icon={faRefresh} className='h-3 w-3' />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                    <td className='border border-stone-300 px-4 py-3'>
                                        <LicenseExpirePicker userId={user.id} currentExpire={user.license_expire} onDateChange={handleLicenseExpireChange} />
                                    </td>
                                    <td className='border border-stone-300 px-4 py-3' style={{ width: statusColumnWidth }}>
                                        <div className='flex items-center justify-center gap-2'>
                                            <ToggleButton userId={user.id} currentStatus={user.status} onStatusChange={handleStatusChange} />
                                            <button onClick={() => handleOpenEditAccountModal(user)} className='rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600' title='Edit info'>
                                                <FontAwesomeIcon icon={faEdit} className='h-3.5 w-3.5' />
                                            </button>
                                            <button onClick={() => handleDeleteAccount(user.id, user.username)} className='rounded p-1.5 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-600' title='Xóa'>
                                                <FontAwesomeIcon icon={faTrash} className='h-3.5 w-3.5' />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ChangePasswordModal isOpen={changePasswordModal.isOpen} onClose={handleCloseChangePasswordModal} />
            <CreateAccountModal isOpen={createAccountModal.isOpen} onClose={handleCloseCreateAccountModal} onAccountCreated={handleAccountCreated} />
            <EditAccountModal isOpen={editAccountModal.isOpen} user={editAccountModal.user} onClose={handleCloseEditAccountModal} onAccountUpdated={handleAccountUpdated} />
        </main>
    );
};

export default Dashboard;
