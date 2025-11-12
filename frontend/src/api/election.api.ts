import apiClient from '@/lib/axios';
import {
    type ApiResponse,
    type Election,
    type PaginatedResponse,
    type CreateElectionForm,
    type ElectionResults
} from '@/types';

export const electionApi = {
    // Get all elections - FIXED
    getAll: async (state?: string, page = 1, limit = 10) => {
        const params = new URLSearchParams();
        if (state) params.append('state', state);
        params.append('page', page.toString());
        params.append('limit', limit.toString());

        const response = await apiClient.get<ApiResponse<{
            elections: Election[];
            pagination: {
                page: number;
                limit: number;
                total: number;
                pages: number;
            };
        }>>(
            `/elections?${params.toString()}`
        );

        // Transform response to match PaginatedResponse structure
        return {
            data: response.data.data!.elections,  // Extract elections array
            pagination: response.data.data!.pagination
        };
    },

    // Get election by ID - FIXED
    getById: async (electionId: string) => {
        const response = await apiClient.get<ApiResponse<{ election: Election }>>(
            `/elections/${electionId}`
        );
        return response.data.data!.election;
    },

    // Create election (Admin) - FIXED
    create: async (data: CreateElectionForm) => {
        const response = await apiClient.post<ApiResponse<{ election: Election }>>(
            '/elections',
            data
        );
        return response.data.data!.election;
    },

    // Start registration phase (Admin) - FIXED
    startRegistration: async (electionId: string) => {
        const response = await apiClient.post<ApiResponse<{ election: Election }>>(
            `/elections/${electionId}/registration/start`
        );
        return response.data.data!.election;
    },

    // Start voting phase (Admin) - FIXED
    startVoting: async (electionId: string) => {
        const response = await apiClient.post<ApiResponse<{ election: Election }>>(
            `/elections/${electionId}/voting/start`
        );
        return response.data.data!.election;
    },

    // End election (Admin) - FIXED
    end: async (electionId: string) => {
        const response = await apiClient.post<ApiResponse<{ election: Election }>>(
            `/elections/${electionId}/end`
        );
        return response.data.data!.election;
    },

    // Add eligible voter (Admin)
    addEligibleVoter: async (electionId: string, voterId: string) => {
        const response = await apiClient.post<ApiResponse<any>>(
            `/elections/${electionId}/voters/${voterId}`
        );
        return response.data;
    },

    // Get election results
    getResults: async (electionId: string) => {
        const response = await apiClient.get<ApiResponse<ElectionResults>>(
            `/elections/${electionId}/results`
        );
        return response.data.data!;
    },

    // Get election statistics
    getStatistics: async (electionId: string) => {
        const response = await apiClient.get<ApiResponse<any>>(
            `/elections/${electionId}/statistics`
        );
        return response.data.data!;
    },

    registerForElection: async (electionId: string) => {
        const response = await apiClient.post<ApiResponse<{
            message: string;
            election: Election;
        }>>(
            `/elections/${electionId}/register`
        );
        return response.data.data!;
    },

    checkRegistration: async (electionId: string) => {
        const response = await apiClient.get<ApiResponse<{
            isRegistered: boolean;
            hasVoted: boolean;
            canVote: boolean;
        }>>(
            `/elections/${electionId}/check-registration`
        );
        return response.data.data!;
    },
};
