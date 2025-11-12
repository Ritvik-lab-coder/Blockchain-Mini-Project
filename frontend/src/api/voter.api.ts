import apiClient from '@/lib/axios';
import { type ApiResponse, type Voter, type PaginatedResponse } from '@/types';

export const voterApi = {
    // Register as voter
    register: async () => {
        const response = await apiClient.post<ApiResponse<{ voter: Voter }>>(
            '/voters/register',
            {}
        );
        return response.data.data!.voter;
    },

    // Get my voter profile
    getMyProfile: async () => {
        const response = await apiClient.get<ApiResponse<{ voter: Voter }>>(
            '/voters/me'
        );
        return response.data.data!.voter;
    },

    // Get all voters (Admin) - FIXED
    getAll: async (status?: string, page = 1, limit = 10) => {
        const params = new URLSearchParams();
        if (status) params.append('status', status);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await apiClient.get<ApiResponse<{
            voters: Voter[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                pages: number;
            };
        }>>(
            `/voters?${params.toString()}`
        );

        // Transform backend response to match PaginatedResponse structure
        return {
            data: response.data.data!.voters,  // Extract voters array from response
            pagination: response.data.data!.pagination
        };
    },

    // Get voter details (Admin)
    getById: async (voterId: string) => {
        const response = await apiClient.get<ApiResponse<{ voter: Voter }>>(
            `/voters/${voterId}`
        );
        return response.data.data!.voter;
    },

    // Approve voter (Admin)
    approve: async (voterId: string) => {
        const response = await apiClient.post<ApiResponse<{ voter: Voter }>>(
            `/voters/${voterId}/approve`
        );
        return response.data.data!.voter;
    },

    // Reject voter (Admin)
    reject: async (voterId: string, reason: string) => {
        const response = await apiClient.post<ApiResponse<{ voter: Voter }>>(
            `/voters/${voterId}/reject`,
            { reason }
        );
        return response.data.data!.voter;
    },

    // Check if voted in election
    hasVoted: async (voterId: string, electionId: string) => {
        const response = await apiClient.get<ApiResponse<{ hasVoted: boolean }>>(
            `/voters/${voterId}/elections/${electionId}/voted`
        );
        return response.data.data!.hasVoted;
    },
};
