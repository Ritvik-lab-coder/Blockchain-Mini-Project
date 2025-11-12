import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { electionApi } from '@/api/election.api';
import { votingApi } from '@/api/voting.api';
import { queryKeys } from '@/lib/queryClient';
import { toast } from 'sonner';

export const useElections = (state?: string, page = 1, limit = 10) => {
    return useQuery({
        queryKey: queryKeys.electionsList(state),
        queryFn: () => electionApi.getAll(state, page, limit),
    });
};

export const useElection = (electionId: string) => {
    return useQuery({
        queryKey: queryKeys.election(electionId),
        queryFn: () => electionApi.getById(electionId),
        enabled: !!electionId,
    });
};

export const useElectionResults = (electionId: string) => {
    return useQuery({
        queryKey: queryKeys.electionResults(electionId),
        queryFn: () => electionApi.getResults(electionId),
        enabled: !!electionId,
    });
};

export const useCanVote = (electionId: string) => {
    return useQuery({
        queryKey: queryKeys.canVote(electionId),
        queryFn: () => votingApi.canVote(electionId),
        enabled: !!electionId,
    });
};

export const useCastVote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: votingApi.castVote,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: queryKeys.votingHistory });
            queryClient.invalidateQueries({ queryKey: queryKeys.elections });
            toast.success('Vote cast successfully!', {
                description: `Transaction: ${data.transactionHash.slice(0, 10)}...`,
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to cast vote');
        },
    });
};

export const useVotingHistory = () => {
    return useQuery({
        queryKey: queryKeys.votingHistory,
        queryFn: votingApi.getHistory,
    });
};
