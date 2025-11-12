import apiClient from '@/lib/axios';
import { type ApiResponse, type DashboardStats, type AuditLog, type PaginatedResponse, type User } from '@/types';

export const adminApi = {
    // Get dashboard statistics
    getDashboardStats: async () => {
        const response = await apiClient.get<ApiResponse<DashboardStats>>(
            '/admin/dashboard/stats'
        );
        return response.data.data!;
    },

    // Get system health
    getSystemHealth: async () => {
        const response = await apiClient.get<ApiResponse<any>>(
            '/admin/system/health'
        );
        return response.data.data!;
    },

    // Get audit logs
    getAuditLogs: async (action?: string, page = 1, limit = 20) => {
        const params = new URLSearchParams();
        if (action) params.append('action', action);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await apiClient.get<ApiResponse<PaginatedResponse<AuditLog>>>(
            `/admin/audit-logs?${params.toString()}`
        );
        return response.data.data!;
    },

    // Get all users
    getAllUsers: async (role?: string, page = 1, limit = 10) => {
        const params = new URLSearchParams();
        if (role) params.append('role', role);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>(
            `/admin/users?${params.toString()}`
        );
        return response.data.data!;
    },

    // Deactivate user
    deactivateUser: async (userId: string) => {
        const response = await apiClient.post<ApiResponse<null>>(
            `/admin/users/${userId}/deactivate`
        );
        return response.data;
    },

    // Activate user
    activateUser: async (userId: string) => {
        const response = await apiClient.post<ApiResponse<null>>(
            `/admin/users/${userId}/activate`
        );
        return response.data;
    },
};
