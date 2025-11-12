import apiClient from '@/lib/axios';
import {
    type LoginCredentials,
    type RegisterData,
    type AuthResponse,
    type ApiResponse,
    type User
} from '@/types';

export const authApi = {
    // Register new user
    register: async (data: RegisterData) => {
        const response = await apiClient.post<ApiResponse<AuthResponse>>(
            '/auth/register',
            data
        );
        return response.data.data!;
    },

    // Login user
    login: async (credentials: LoginCredentials) => {
        const response = await apiClient.post<ApiResponse<AuthResponse>>(
            '/auth/login',
            credentials
        );
        return response.data.data!;
    },

    // Logout user
    logout: async () => {
        const response = await apiClient.post<ApiResponse<null>>('/auth/logout');
        return response.data;
    },

    // Get current user profile
    getProfile: async () => {
        const response = await apiClient.get<ApiResponse<{ user: User }>>(
            '/auth/profile'
        );
        return response.data.data!.user;
    },

    // Verify token
    verifyToken: async () => {
        const response = await apiClient.get<ApiResponse<{ user: User }>>(
            '/auth/verify'
        );
        return response.data.data!.user;
    },

    // Refresh access token
    refreshToken: async (refreshToken: string) => {
        const response = await apiClient.post<ApiResponse<{ accessToken: string }>>(
            '/auth/refresh-token',
            { refreshToken }
        );
        return response.data.data!;
    },
};
