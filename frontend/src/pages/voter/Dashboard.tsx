import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatCard } from '@/components/features/StatCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useVoter, useRegisterVoter } from '@/hooks/useVoter';
import { useElections } from '@/hooks/useElections';
import { useVotingHistory } from '@/hooks/useElections';
import { Vote, ListChecks, History, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const VoterDashboard = () => {
    const { data: voter, isLoading: voterLoading } = useVoter();
    const { data: electionsData, isLoading: electionsLoading } = useElections('voting');
    const { data: votingHistory } = useVotingHistory();
    const registerMutation = useRegisterVoter();

    const handleRegisterAsVoter = () => {
        registerMutation.mutate();
    };

    if (voterLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" text="Loading dashboard..." />
            </div>
        );
    }

    // Not registered as voter yet
    if (!voter) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Welcome to BlockVote</h1>
                    <p className="text-muted-foreground">Get started by registering as a voter</p>
                </div>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Registration Required</AlertTitle>
                    <AlertDescription>
                        You need to register as a voter before you can participate in elections. This will generate your unique voter commitment on the blockchain.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Register as Voter</CardTitle>
                        <CardDescription>
                            Complete your voter registration to access all features
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={handleRegisterAsVoter}
                            disabled={registerMutation.isPending}
                            size="lg"
                        >
                            {registerMutation.isPending ? 'Registering...' : 'Register Now'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Pending approval
    if (voter.status === 'pending') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Voter Registration</h1>
                    <p className="text-muted-foreground">Your registration is pending approval</p>
                </div>

                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Awaiting Approval</AlertTitle>
                    <AlertDescription>
                        Your voter registration has been submitted and is awaiting admin approval. You'll be notified once approved.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Registration Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Status</p>
                            <Badge variant="outline" className="mt-1">Pending Approval</Badge>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Voter Commitment</p>
                            <p className="text-sm font-mono mt-1 break-all">{voter.voterCommitment}</p>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Registered On</p>
                            <p className="text-sm mt-1">{new Date(voter.createdAt).toLocaleDateString()}</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Rejected
    if (voter.status === 'rejected') {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Voter Registration</h1>
                    <p className="text-muted-foreground">Your registration was not approved</p>
                </div>

                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Registration Rejected</AlertTitle>
                    <AlertDescription>
                        Your voter registration was rejected by an administrator. Please contact support for more information.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Approved - Show dashboard
    const activeElections = electionsData?.data || [];
    const totalVotes = votingHistory?.length || 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <p className="text-muted-foreground">Overview of your voting activity</p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <StatCard
                    title="Active Elections"
                    value={activeElections.length}
                    description="Elections you can vote in"
                    icon={Vote}
                />
                <StatCard
                    title="Elections Voted"
                    value={totalVotes}
                    description="Your voting history"
                    icon={History}
                />
                <StatCard
                    title="Eligible Elections"
                    value={voter.eligibleElections?.length || 0}
                    description="Total elections accessible"
                    icon={ListChecks}
                />
            </div>

            {/* Registration Status */}
            <Card>
                <CardHeader>
                    <CardTitle>Voter Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-sm font-medium">Registration Status</p>
                            <div className="flex items-center space-x-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <Badge variant="default" className="bg-green-500">Approved</Badge>
                            </div>
                        </div>
                        {voter.isRegisteredOnChain && (
                            <div className="space-y-1 text-right">
                                <p className="text-sm font-medium">Blockchain Status</p>
                                <Badge variant="outline" className="bg-blue-50">On-Chain</Badge>
                            </div>
                        )}
                    </div>
                    {voter.registrationTxHash && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
                            <p className="text-xs font-mono mt-1 break-all text-muted-foreground">
                                {voter.registrationTxHash}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Active Elections */}
            {!electionsLoading && activeElections.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Active Elections</CardTitle>
                                <CardDescription>Elections currently accepting votes</CardDescription>
                            </div>
                            <Button asChild variant="outline">
                                <Link to="/voter/elections">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {activeElections.slice(0, 3).map((election: any) => (
                                <Link
                                    key={election._id}
                                    to={`/voter/elections/${election._id}`}
                                    className="block p-4 border rounded-lg hover:bg-accent transition-colors"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{election.title}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {election.candidates.length} candidates
                                            </p>
                                        </div>
                                        <Badge>Active</Badge>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <Button asChild variant="outline" className="h-20">
                            <Link to="/voter/elections">
                                <div className="flex flex-col items-center space-y-2">
                                    <Vote className="h-6 w-6" />
                                    <span>Browse Elections</span>
                                </div>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20">
                            <Link to="/voter/history">
                                <div className="flex flex-col items-center space-y-2">
                                    <History className="h-6 w-6" />
                                    <span>Voting History</span>
                                </div>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20">
                            <Link to="/voter/verify">
                                <div className="flex flex-col items-center space-y-2">
                                    <CheckCircle2 className="h-6 w-6" />
                                    <span>Verify Vote</span>
                                </div>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
