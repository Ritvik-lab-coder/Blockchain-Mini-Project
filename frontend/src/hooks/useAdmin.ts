import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/api/admin.api';
import { voterApi } from '@/api/voter.api';
import { queryKeys } from '@/lib/queryClient';
import { toast } from 'sonner';

export const useDashboardStats = () => {
    return useQuery({
        queryKey: queryKeys.dashboardStats,
        queryFn: adminApi.getDashboardStats,
        refetchInterval: 30000, // Refetch every 30 seconds
    });
};

export const useSystemHealth = () => {
    return useQuery({
        queryKey: queryKeys.systemHealth,
        queryFn: adminApi.getSystemHealth,
        refetchInterval: 60000, // Refetch every minute
    });
};

export const useAuditLogs = (action?: string, page = 1, limit = 20) => {
    return useQuery({
        queryKey: queryKeys.auditLogs(action),
        queryFn: () => adminApi.getAuditLogs(action, page, limit),
    });
};

export const useAllVoters = (status?: string, page = 1, limit = 10) => {
    return useQuery({
        queryKey: queryKeys.votersList(status),
        queryFn: () => voterApi.getAll(status, page, limit),
    });
};

export const useApproveVoter = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (voterId: string) => voterApi.approve(voterId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.voters });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
            toast.success('Voter approved and registered on blockchain', {
                description: 'The voter can now participate in elections',
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to approve voter');
        },
    });
};

export const useRejectVoter = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ voterId, reason }: { voterId: string; reason: string }) =>
            voterApi.reject(voterId, reason),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.voters });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
            toast.success('Voter registration rejected');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to reject voter');
        },
    });
};

export const useAllUsers = (role?: string, page = 1, limit = 10) => {
    return useQuery({
        queryKey: queryKeys.users(role),
        queryFn: () => adminApi.getAllUsers(role, page, limit),
    });
};

export const useDeactivateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => adminApi.deactivateUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users() });
            toast.success('User deactivated successfully');
        },
    });
};

export const useActivateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => adminApi.activateUser(userId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.users() });
            toast.success('User activated successfully');
        },
    });
};
