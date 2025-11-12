import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { StatCard } from '@/components/features/StatCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useDashboardStats, useSystemHealth, useAuditLogs } from '@/hooks/useAdmin';
import { useElections } from '@/hooks/useElections';
import { useAllVoters } from '@/hooks/useAdmin';
import {
    Users,
    Vote,
    ListChecks,
    CheckCircle2,
    Clock,
    Activity,
    AlertCircle,
} from 'lucide-react';
import { format } from 'date-fns';

export const AdminDashboard = () => {
    const { data: stats, isLoading: statsLoading } = useDashboardStats();
    const { data: health, isError: healthError } = useSystemHealth();
    const { data: recentLogs } = useAuditLogs(undefined, 1, 5);
    const { data: activeElections } = useElections('voting', 1, 5);
    const { data: pendingVoters } = useAllVoters('pending', 1, 5);

    if (statsLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" text="Loading dashboard..." />
            </div>
        );
    }

    // Safe data access with fallbacks
    const activeElectionsList = activeElections?.data || [];
    const pendingVotersList = pendingVoters?.data || [];
    const recentLogsList = recentLogs?.data || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage your blockchain voting system</p>
            </div>

            {/* System Health Alert */}
            {health && !healthError && (
                <Alert className={health.blockchain === 'connected' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
                    <Activity className="h-4 w-4" />
                    <AlertTitle>System Status</AlertTitle>
                    <AlertDescription className="flex items-center space-x-4 mt-2">
                        <div className="flex items-center space-x-2">
                            <Badge variant={health.database === 'connected' ? 'default' : 'destructive'}>
                                Database: {health.database}
                            </Badge>
                            <Badge variant={health.blockchain === 'connected' ? 'default' : 'destructive'}>
                                Blockchain: {health.blockchain}
                            </Badge>
                            <Badge variant={health.zkp === 'ready' ? 'default' : 'destructive'}>
                                ZKP: {health.zkp}
                            </Badge>
                        </div>
                    </AlertDescription>
                </Alert>
            )}

            {healthError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>System Health Check Failed</AlertTitle>
                    <AlertDescription>
                        Unable to fetch system health status. The system may still be functional.
                    </AlertDescription>
                </Alert>
            )}

            {/* Statistics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Users"
                    value={stats?.users.total || 0}
                    description="Registered users"
                    icon={Users}
                />
                <StatCard
                    title="Approved Voters"
                    value={stats?.voters.approved || 0}
                    description={`${stats?.voters.pending || 0} pending approval`}
                    icon={CheckCircle2}
                    iconColor="text-green-600"
                />
                <StatCard
                    title="Total Elections"
                    value={stats?.elections.total || 0}
                    description={`${stats?.elections.active || 0} currently active`}
                    icon={ListChecks}
                    iconColor="text-blue-600"
                />
                <StatCard
                    title="Total Votes"
                    value={stats?.votes.total || 0}
                    description="Votes recorded"
                    icon={Vote}
                    iconColor="text-purple-600"
                />
            </div>

            {/* Pending Voters Alert */}
            {stats && stats.voters.pending > 0 && (
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertTitle>Pending Voter Approvals</AlertTitle>
                    <AlertDescription>
                        You have {stats.voters.pending} voter registration(s) waiting for approval.
                        <Button asChild variant="link" className="px-2">
                            <Link to="/admin/voters?status=pending">Review now</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                {/* Active Elections */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Active Elections</CardTitle>
                                <CardDescription>Currently accepting votes</CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link to="/admin/elections">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {activeElectionsList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No active elections
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {activeElectionsList.map((election) => (
                                    <Link
                                        key={election._id}
                                        to={`/admin/elections/${election._id}`}
                                        className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">{election.title}</p>
                                                <p className="text-xs text-muted-foreground">
                                                    {election.totalVotesCast} / {election.totalVotersRegistered} votes
                                                </p>
                                            </div>
                                            <Badge>Active</Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Pending Voters */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Pending Voters</CardTitle>
                                <CardDescription>Awaiting approval</CardDescription>
                            </div>
                            <Button asChild variant="outline" size="sm">
                                <Link to="/admin/voters?status=pending">View All</Link>
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {pendingVotersList.length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                No pending approvals
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {pendingVotersList.map((voter) => (
                                    <Link
                                        key={voter._id}
                                        to={`/admin/voters?status=pending`}
                                        className="block p-3 border rounded-lg hover:bg-accent transition-colors"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium text-sm">
                                                    Voter {voter._id.slice(0, 8)}...
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    Registered {format(new Date(voter.createdAt), 'PPp')}
                                                </p>
                                            </div>
                                            <Badge variant="outline">Pending</Badge>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Recent Activity</CardTitle>
                            <CardDescription>Latest system actions</CardDescription>
                        </div>
                        <Button asChild variant="outline" size="sm">
                            <Link to="/admin/logs">View All Logs</Link>
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {recentLogsList.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No recent activity
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {recentLogsList.map((log) => (
                                <div key={log._id} className="flex items-start space-x-3 p-3 border rounded-lg">
                                    <div className="rounded-full bg-primary/10 p-2">
                                        <Activity className="h-4 w-4 text-primary" />
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium">{log.action.replace(/_/g, ' ')}</p>
                                        <p className="text-xs text-muted-foreground">{log.description}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(log.timestamp), 'PPp')}
                                        </p>
                                    </div>
                                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'}>
                                        {log.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Button asChild variant="outline" className="h-20">
                            <Link to="/admin/elections/create">
                                <div className="flex flex-col items-center space-y-2">
                                    <ListChecks className="h-6 w-6" />
                                    <span>Create Election</span>
                                </div>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20">
                            <Link to="/admin/voters?status=pending">
                                <div className="flex flex-col items-center space-y-2">
                                    <Clock className="h-6 w-6" />
                                    <span>Approve Voters</span>
                                </div>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20">
                            <Link to="/admin/elections">
                                <div className="flex flex-col items-center space-y-2">
                                    <Vote className="h-6 w-6" />
                                    <span>Manage Elections</span>
                                </div>
                            </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20">
                            <Link to="/admin/logs">
                                <div className="flex flex-col items-center space-y-2">
                                    <Activity className="h-6 w-6" />
                                    <span>View Logs</span>
                                </div>
                            </Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};
