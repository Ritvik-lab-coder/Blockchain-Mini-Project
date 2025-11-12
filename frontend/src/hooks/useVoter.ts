import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voterApi } from '@/api/voter.api';
import { queryKeys } from '@/lib/queryClient';
import { toast } from 'sonner';

export const useVoter = () => {
    return useQuery({
        queryKey: queryKeys.myVoterProfile,
        queryFn: voterApi.getMyProfile,
        retry: 1,
    });
};

export const useRegisterVoter = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: voterApi.register,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.myVoterProfile });
            toast.success('Voter registration submitted successfully!');
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to register as voter');
        },
    });
};
