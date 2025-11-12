import { useMutation, useQueryClient } from '@tanstack/react-query';
import { electionApi } from '@/api/election.api';
import { queryKeys } from '@/lib/queryClient';
import { type CreateElectionForm } from '@/types';
import { toast } from 'sonner';

export const useCreateElection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateElectionForm) => electionApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.elections });
            queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
            toast.success('Election created successfully', {
                description: 'The election has been registered on the blockchain',
            });
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to create election');
        },
    });
};

export const useStartRegistration = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (electionId: string) => electionApi.startRegistration(electionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.elections });
            toast.success('Registration phase started');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to start registration');
        },
    });
};

export const useStartVoting = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (electionId: string) => electionApi.startVoting(electionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.elections });
            toast.success('Voting phase started');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to start voting');
        },
    });
};

export const useEndElection = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (electionId: string) => electionApi.end(electionId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.elections });
            toast.success('Election ended successfully');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to end election');
        },
    });
};

export const useAddEligibleVoter = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ electionId, voterId }: { electionId: string; voterId: string }) =>
            electionApi.addEligibleVoter(electionId, voterId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.elections });
            toast.success('Voter added to election');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to add voter');
        },
    });
};
