const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/api/admin/login',
        VERIFY_TOKEN: '/api/admin/verify-token',
        CHANGE_PASSWORD: '/api/admin/change-password'
    },
    USERS: {
        GET_LIST: '/api/admin/get-list-users',
        TOGGLE_STATUS: '/api/admin/toggle-account-status',
        UPDATE_LICENSE_EXPIRE: '/api/admin/update-license-expire',
        RESET_HWID: '/api/admin/reset-hwid',
        DELETE_ACCOUNT: '/api/admin/delete-account',
        CREATE_ACCOUNT: '/api/admin/create-account',
        UPDATE_ACCOUNT: '/api/admin/update-account'
    }
} as const;
export default API_ENDPOINTS;
