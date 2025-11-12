import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useAllVoters, useApproveVoter, useRejectVoter } from '@/hooks/useAdmin';
import { type Voter } from '@/types';
import { Search, CheckCircle2, XCircle, Eye, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export const Voters = () => {
    const [searchParams] = useSearchParams();
    const initialStatus = searchParams.get('status') || 'all';

    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState(initialStatus);
    const [selectedVoter, setSelectedVoter] = useState<Voter | null>(null);
    const [showDetailsDialog, setShowDetailsDialog] = useState(false);
    const [showApproveDialog, setShowApproveDialog] = useState(false);
    const [showRejectDialog, setShowRejectDialog] = useState(false);
    const [rejectReason, setRejectReason] = useState('');

    // Fetch data for each tab separately
    const statusFilter = activeTab === 'all' ? undefined : activeTab;
    const { data: votersData, isLoading } = useAllVoters(statusFilter, 1, 100);

    const approveMutation = useApproveVoter();
    const rejectMutation = useRejectVoter();

    const voters = votersData?.data || [];

    const filteredVoters = voters.filter(
        (voter) =>
            voter._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            voter.voterCommitment.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleViewDetails = (voter: Voter) => {
        setSelectedVoter(voter);
        setShowDetailsDialog(true);
    };

    const handleApproveClick = (voter: Voter) => {
        setSelectedVoter(voter);
        setShowApproveDialog(true);
    };

    const handleRejectClick = (voter: Voter) => {
        setSelectedVoter(voter);
        setRejectReason('');
        setShowRejectDialog(true);
    };

    const handleApprove = async () => {
        if (!selectedVoter) return;
        await approveMutation.mutateAsync(selectedVoter._id);
        setShowApproveDialog(false);
        setSelectedVoter(null);
    };

    const handleReject = async () => {
        if (!selectedVoter || !rejectReason.trim()) return;
        await rejectMutation.mutateAsync({ voterId: selectedVoter._id, reason: rejectReason });
        setShowRejectDialog(false);
        setSelectedVoter(null);
        setRejectReason('');
    };

    const getStatusBadge = (status: string) => {
        const variants: Record<string, any> = {
            pending: { variant: 'outline' as const, label: 'Pending', color: 'text-yellow-600' },
            approved: { variant: 'default' as const, label: 'Approved', color: 'text-green-600' },
            rejected: { variant: 'destructive' as const, label: 'Rejected', color: 'text-red-600' },
        };
        return variants[status] || variants.pending;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Voter Management</h1>
                <p className="text-muted-foreground">Manage voter registrations and approvals</p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="Search by voter ID or commitment..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="all">All Voters</TabsTrigger>
                    <TabsTrigger value="pending">
                        Pending ({votersData?.pagination.total || 0})
                    </TabsTrigger>
                    <TabsTrigger value="approved">Approved</TabsTrigger>
                    <TabsTrigger value="rejected">Rejected</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                    <Card>
                        <CardHeader>
                            <CardTitle>
                                {activeTab === 'all' && 'All Voters'}
                                {activeTab === 'pending' && 'Pending Approvals'}
                                {activeTab === 'approved' && 'Approved Voters'}
                                {activeTab === 'rejected' && 'Rejected Voters'}
                            </CardTitle>
                            <CardDescription>
                                {filteredVoters.length} voter(s) found
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <LoadingSpinner size="lg" text="Loading voters..." />
                                </div>
                            ) : filteredVoters.length === 0 ? (
                                <div className="text-center py-12">
                                    <p className="text-muted-foreground">No voters found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Voter ID</TableHead>
                                                <TableHead>Commitment</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead>Registered</TableHead>
                                                <TableHead>On-Chain</TableHead>
                                                <TableHead>Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredVoters.map((voter) => {
                                                const statusBadge = getStatusBadge(voter.status);
                                                return (
                                                    <TableRow key={voter._id}>
                                                        <TableCell className="font-mono text-xs">
                                                            {voter._id.slice(0, 8)}...
                                                        </TableCell>
                                                        <TableCell className="font-mono text-xs">
                                                            {voter.voterCommitment.slice(0, 10)}...
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant={statusBadge.variant}>
                                                                {statusBadge.label}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-sm">
                                                            {format(new Date(voter.createdAt), 'PP')}
                                                        </TableCell>
                                                        <TableCell>
                                                            {voter.isRegisteredOnChain ? (
                                                                <Badge variant="outline" className="bg-blue-50">
                                                                    Yes
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="outline">No</Badge>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center space-x-2">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleViewDetails(voter)}
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Button>
                                                                {voter.status === 'pending' && (
                                                                    <>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleApproveClick(voter)}
                                                                            disabled={approveMutation.isPending}
                                                                        >
                                                                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => handleRejectClick(voter)}
                                                                            disabled={rejectMutation.isPending}
                                                                        >
                                                                            <XCircle className="h-4 w-4 text-red-600" />
                                                                        </Button>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Details Dialog */}
            <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Voter Details</DialogTitle>
                    </DialogHeader>
                    {selectedVoter && (
                        <div className="space-y-4">
                            <div>
                                <Label className="text-muted-foreground">Voter ID</Label>
                                <p className="font-mono text-sm mt-1 break-all">{selectedVoter._id}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Voter Commitment</Label>
                                <p className="font-mono text-sm mt-1 break-all">
                                    {selectedVoter.voterCommitment}
                                </p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Status</Label>
                                <div className="mt-1">
                                    <Badge variant={getStatusBadge(selectedVoter.status).variant}>
                                        {getStatusBadge(selectedVoter.status).label}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Registered On Chain</Label>
                                <p className="text-sm mt-1">
                                    {selectedVoter.isRegisteredOnChain ? 'Yes' : 'No'}
                                </p>
                            </div>
                            {selectedVoter.registrationTxHash && (
                                <div>
                                    <Label className="text-muted-foreground">Transaction Hash</Label>
                                    <p className="font-mono text-sm mt-1 break-all">
                                        {selectedVoter.registrationTxHash}
                                    </p>
                                </div>
                            )}
                            <div>
                                <Label className="text-muted-foreground">Registration Date</Label>
                                <p className="text-sm mt-1">
                                    {format(new Date(selectedVoter.createdAt), 'PPP p')}
                                </p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Eligible Elections</Label>
                                <p className="text-sm mt-1">
                                    {selectedVoter.eligibleElections?.length || 0} election(s)
                                </p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Voted Elections</Label>
                                <p className="text-sm mt-1">
                                    {selectedVoter.votedElections?.length || 0} vote(s) cast
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Approve Dialog */}
            <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Approve Voter Registration</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will register the voter on the blockchain. This action may take 10-15 seconds.
                            <br /><br />
                            Voter ID: <span className="font-mono">{selectedVoter?._id.slice(0, 16)}...</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={approveMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleApprove}
                            disabled={approveMutation.isPending}
                        >
                            {approveMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Approve & Register
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Reject Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Reject Voter Registration</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this voter registration.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="reason">Reason for Rejection</Label>
                            <Textarea
                                id="reason"
                                placeholder="Enter reason..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                rows={4}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowRejectDialog(false)}
                            disabled={rejectMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectReason.trim() || rejectMutation.isPending}
                        >
                            {rejectMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Reject
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
