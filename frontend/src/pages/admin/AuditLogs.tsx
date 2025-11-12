import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAuditLogs } from '@/hooks/useAdmin';
import { Search, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export const AuditLogs = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [actionFilter, setActionFilter] = useState<string>('all');

    const filterValue = actionFilter === 'all' ? undefined : actionFilter;
    const { data: logsData, isLoading } = useAuditLogs(filterValue, 1, 50);

    const logs = logsData?.data || [];

    const filteredLogs = logs.filter((log) =>
        log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.action.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'failure':
                return <XCircle className="h-4 w-4 text-red-600" />;
            case 'pending':
                return <Clock className="h-4 w-4 text-yellow-600" />;
            default:
                return <Activity className="h-4 w-4 text-gray-600" />;
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            success: { variant: 'default' as const, label: 'Success' },
            failure: { variant: 'destructive' as const, label: 'Failed' },
            pending: { variant: 'outline' as const, label: 'Pending' },
        };
        return variants[status] || variants.success;
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" text="Loading audit logs..." />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Audit Logs</h1>
                <p className="text-muted-foreground">System activity and security logs</p>
            </div>

            {/* Filters */}
            <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="Search logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                    <SelectTrigger>
                        <SelectValue placeholder="Filter by action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="login">Login</SelectItem>
                        <SelectItem value="voter_registration">Voter Registration</SelectItem>
                        <SelectItem value="voter_approval">Voter Approval</SelectItem>
                        <SelectItem value="election_created">Election Created</SelectItem>
                        <SelectItem value="vote_cast">Vote Cast</SelectItem>
                        <SelectItem value="admin_action">Admin Action</SelectItem>
                        <SelectItem value="security_event">Security Event</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Activity Log</CardTitle>
                    <CardDescription>{filteredLogs.length} log entries found</CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredLogs.length === 0 ? (
                        <div className="text-center py-12">
                            <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No audit logs found</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredLogs.map((log) => {
                                const statusBadge = getStatusBadge(log.status);
                                return (
                                    <div key={log._id} className="border rounded-lg p-4 space-y-3">
                                        {/* Header */}
                                        <div className="flex items-start justify-between">
                                            <div className="flex items-center space-x-3">
                                                {getStatusIcon(log.status)}
                                                <div>
                                                    <p className="font-medium">
                                                        {log.action.replace(/_/g, ' ').toUpperCase()}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {format(new Date(log.timestamp), 'PPP p')}
                                                    </p>
                                                </div>
                                            </div>
                                            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
                                        </div>

                                        {/* Description */}
                                        <p className="text-sm">{log.description}</p>

                                        {/* Details Grid */}
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                            {log.userId && (
                                                <div>
                                                    <p className="text-muted-foreground">User ID</p>
                                                    <p className="font-mono text-xs">{log.userId.slice(0, 8)}...</p>
                                                </div>
                                            )}
                                            {log.ipAddress && (
                                                <div>
                                                    <p className="text-muted-foreground">IP Address</p>
                                                    <p className="font-mono text-xs">{log.ipAddress}</p>
                                                </div>
                                            )}
                                            {log.blockchainTxHash && (
                                                <div>
                                                    <p className="text-muted-foreground">Tx Hash</p>
                                                    <p className="font-mono text-xs">
                                                        {log.blockchainTxHash.slice(0, 10)}...
                                                    </p>
                                                </div>
                                            )}
                                            {log.targetModel && (
                                                <div>
                                                    <p className="text-muted-foreground">Target</p>
                                                    <p className="text-xs">{log.targetModel}</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Error Message */}
                                        {log.errorMessage && (
                                            <div className="bg-destructive/10 text-destructive p-3 rounded text-sm">
                                                <p className="font-medium">Error:</p>
                                                <p>{log.errorMessage}</p>
                                            </div>
                                        )}

                                        {/* Metadata */}
                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                            <details className="text-sm">
                                                <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                                                    View Metadata
                                                </summary>
                                                <pre className="mt-2 p-3 bg-muted rounded text-xs overflow-x-auto">
                                                    {JSON.stringify(log.metadata, null, 2)}
                                                </pre>
                                            </details>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
