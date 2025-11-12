import apiClient from '@/lib/axios';
import { type ApiResponse, type CastVoteForm, type VotedElection } from '@/types';

export const votingApi = {
    // Cast vote
    castVote: async (data: CastVoteForm) => {
        const response = await apiClient.post<ApiResponse<{
            success: boolean;
            transactionHash: string;
            message: string;
        }>>('/voting/cast', data);
        return response.data.data!;
    },

    // Verify vote by transaction hash
    verifyVote: async (transactionHash: string) => {
        const response = await apiClient.get<ApiResponse<{
            exists: boolean;
            verified: boolean;
            election: string;
            timestamp: string;
            nullifier: string;
        }>>(`/voting/verify/${transactionHash}`);
        return response.data.data!;
    },

    // Get voting history
    getHistory: async () => {
        const response = await apiClient.get<ApiResponse<{ history: VotedElection[] }>>(
            '/voting/history'
        );
        return response.data.data!.history;
    },

    // Check if can vote
    canVote: async (electionId: string) => {
        const response = await apiClient.get<ApiResponse<{
            canVote: boolean;
            reason?: string;
            voterId?: string;
        }>>(`/voting/can-vote/${electionId}`);
        return response.data.data!;
    },
};
