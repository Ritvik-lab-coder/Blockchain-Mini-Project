import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
        },
        mutations: {
            retry: 0,
        },
    },
});

// Query keys
export const queryKeys = {
    // Auth
    profile: ['profile'] as const,

    // Voters
    voters: ['voters'] as const,
    votersList: (status?: string) => ['voters', 'list', status] as const,
    voter: (id: string) => ['voters', id] as const,
    myVoterProfile: ['voters', 'me'] as const,

    // Elections
    elections: ['elections'] as const,
    electionsList: (state?: string) => ['elections', 'list', state] as const,
    election: (id: string) => ['elections', id] as const,
    electionResults: (id: string) => ['elections', id, 'results'] as const,
    electionStats: (id: string) => ['elections', id, 'stats'] as const,

    // Voting
    votingHistory: ['voting', 'history'] as const,
    canVote: (electionId: string) => ['voting', 'can-vote', electionId] as const,

    // Admin
    dashboardStats: ['admin', 'dashboard'] as const,
    systemHealth: ['admin', 'health'] as const,
    auditLogs: (action?: string) => ['admin', 'logs', action] as const,
    users: (role?: string) => ['admin', 'users', role] as const,
};
