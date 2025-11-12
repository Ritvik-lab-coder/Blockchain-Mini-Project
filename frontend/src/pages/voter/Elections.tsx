import { useState } from 'react';
import { useElections } from '@/hooks/useElections';
import { ElectionCard } from '@/components/features/ElectionCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

export const Elections = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const { data: allElections, isLoading: allLoading } = useElections(undefined, 1, 50);
    const { data: votingElections, isLoading: votingLoading } = useElections('voting', 1, 50);
    const { data: endedElections, isLoading: endedLoading } = useElections('ended', 1, 50);

    const filterElections = (elections: any[]) => {
        if (!searchQuery) return elections;
        return elections.filter((election) =>
            election.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            election.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Elections</h1>
                <p className="text-muted-foreground">Browse and participate in available elections</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search elections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All Elections</TabsTrigger>
                    <TabsTrigger value="active">Active Voting</TabsTrigger>
                    <TabsTrigger value="ended">Ended</TabsTrigger>
                </TabsList>

                <TabsContent value="all" className="space-y-4">
                    {allLoading ? (
                        <LoadingSpinner size="lg" text="Loading elections..." />
                    ) : (
                        <>
                            {filterElections(allElections?.data || []).length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No elections found</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filterElections(allElections?.data || []).map((election) => (
                                        <ElectionCard key={election._id} election={election} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="active" className="space-y-4">
                    {votingLoading ? (
                        <LoadingSpinner size="lg" text="Loading active elections..." />
                    ) : (
                        <>
                            {filterElections(votingElections?.data || []).length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No active elections at the moment</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filterElections(votingElections?.data || []).map((election) => (
                                        <ElectionCard key={election._id} election={election} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>

                <TabsContent value="ended" className="space-y-4">
                    {endedLoading ? (
                        <LoadingSpinner size="lg" text="Loading ended elections..." />
                    ) : (
                        <>
                            {filterElections(endedElections?.data || []).length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No ended elections</p>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filterElections(endedElections?.data || []).map((election) => (
                                        <ElectionCard key={election._id} election={election} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    );
};
