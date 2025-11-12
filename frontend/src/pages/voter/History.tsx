import { Link } from 'react-router-dom';
import { useVotingHistory } from '@/hooks/useElections';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { CheckCircle2, ExternalLink, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export const History = () => {
    const { data: votingHistory, isLoading } = useVotingHistory();

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" text="Loading voting history..." />
            </div>
        );
    }

    const hasVotingHistory = votingHistory && votingHistory.length > 0;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Voting History</h1>
                <p className="text-muted-foreground">Your past voting activity</p>
            </div>

            {!hasVotingHistory ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                        <p className="text-lg font-medium mb-2">No Voting History</p>
                        <p className="text-sm text-muted-foreground mb-4">
                            You haven't cast any votes yet
                        </p>
                        <Button asChild>
                            <Link to="/voter/elections">Browse Elections</Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {votingHistory.map((vote) => (
                        <Card key={vote.txHash}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <CardTitle className="text-lg">Vote Recorded</CardTitle>
                                        <CardDescription>
                                            <div className="flex items-center mt-1">
                                                <Calendar className="mr-2 h-3 w-3" />
                                                {format(new Date(vote.votedAt), 'PPP p')}
                                            </div>
                                        </CardDescription>
                                    </div>
                                    <Badge variant="outline" className="bg-green-50">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Verified
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Transaction Hash</p>
                                    <p className="text-sm font-mono mt-1 break-all">{vote.txHash}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Nullifier</p>
                                    <p className="text-xs font-mono mt-1 break-all text-muted-foreground">
                                        {vote.nullifier}
                                    </p>
                                </div>
                                <Button asChild variant="outline" size="sm">
                                    <Link to={`/voter/verify?tx=${vote.txHash}`}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Verify Vote
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};
