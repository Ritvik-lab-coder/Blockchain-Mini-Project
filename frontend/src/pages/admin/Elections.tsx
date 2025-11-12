import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ElectionCard } from '@/components/features/ElectionCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useElections } from '@/hooks/useElections';
import { Search, Plus } from 'lucide-react';

export const AdminElections = () => {
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Election Management</h1>
          <p className="text-muted-foreground">Create and manage elections</p>
        </div>
        <Button asChild>
          <Link to="/admin/elections/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Election
          </Link>
        </Button>
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
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground mb-4">No elections found</p>
                    <Button asChild>
                      <Link to="/admin/elections/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Create First Election
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filterElections(allElections?.data || []).map((election) => (
                    <Link key={election._id} to={`/admin/elections/${election._id}`}>
                      <ElectionCard election={election} />
                    </Link>
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
                  <p className="text-muted-foreground">No active elections</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filterElections(votingElections?.data || []).map((election) => (
                    <Link key={election._id} to={`/admin/elections/${election._id}`}>
                      <ElectionCard election={election} />
                    </Link>
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
                    <Link key={election._id} to={`/admin/elections/${election._id}`}>
                      <ElectionCard election={election} />
                    </Link>
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
