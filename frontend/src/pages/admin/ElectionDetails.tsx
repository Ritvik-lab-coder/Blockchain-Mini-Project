import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useElection, useElectionResults } from '@/hooks/useElections';
import {
    useStartRegistration,
    useStartVoting,
    useEndElection,
} from '@/hooks/useAdminElections';
import {
    ArrowLeft,
    Calendar,
    Clock,
    Users,
    Vote,
    Play,
    Square,
    CheckCircle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { format } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export const AdminElectionDetails = () => {
    const { electionId } = useParams<{ electionId: string }>();
    const navigate = useNavigate();

    const [showStartRegistrationDialog, setShowStartRegistrationDialog] = useState(false);
    const [showStartVotingDialog, setShowStartVotingDialog] = useState(false);
    const [showEndDialog, setShowEndDialog] = useState(false);

    const { data: election, isLoading } = useElection(electionId!);
    const { data: results } = useElectionResults(electionId!);

    const startRegistrationMutation = useStartRegistration();
    const startVotingMutation = useStartVoting();
    const endElectionMutation = useEndElection();

    const handleStartRegistration = async () => {
        await startRegistrationMutation.mutateAsync(electionId!);
        setShowStartRegistrationDialog(false);
    };

    const handleStartVoting = async () => {
        await startVotingMutation.mutateAsync(electionId!);
        setShowStartVotingDialog(false);
    };

    const handleEndElection = async () => {
        await endElectionMutation.mutateAsync(electionId!);
        setShowEndDialog(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <LoadingSpinner size="lg" text="Loading election..." />
            </div>
        );
    }

    if (!election) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground">Election not found</p>
                <Button onClick={() => navigate('/admin/elections')} className="mt-4">
                    Back to Elections
                </Button>
            </div>
        );
    }

    const turnoutPercentage = election.totalVotersRegistered > 0
        ? (election.totalVotesCast / election.totalVotersRegistered) * 100
        : 0;

    const chartData = results?.results
        .map((result) => ({
            name: result.name,
            votes: result.votes,
            percentage: result.percentage || 0,
        }))
        .sort((a, b) => b.votes - a.votes) || [];

    // Phase stepper logic
    const phases = [
        { key: 'created', label: 'Created', icon: CheckCircle },
        { key: 'registration', label: 'Registration', icon: Users },
        { key: 'voting', label: 'Voting', icon: Vote },
        { key: 'ended', label: 'Ended', icon: Square },
    ];

    const currentPhaseIndex = phases.findIndex(p => p.key === election.state);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Button variant="ghost" onClick={() => navigate('/admin/elections')} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Elections
                </Button>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">{election.title}</h1>
                        <p className="text-muted-foreground mt-2">{election.description}</p>
                    </div>
                    <Badge variant={election.state === 'voting' ? 'default' : 'outline'}>
                        {election.state === 'created' && 'Created'}
                        {election.state === 'registration' && 'Registration Open'}
                        {election.state === 'voting' && 'Voting Active'}
                        {election.state === 'ended' && 'Ended'}
                    </Badge>
                </div>
            </div>

            {/* Phase Stepper */}
            <Card>
                <CardHeader>
                    <CardTitle>Election Phase</CardTitle>
                    <CardDescription>Current progress of the election</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        {phases.map((phase, index) => {
                            const Icon = phase.icon;
                            const isActive = index === currentPhaseIndex;
                            const isCompleted = index < currentPhaseIndex;

                            return (
                                <div key={phase.key} className="flex items-center flex-1">
                                    <div className="flex flex-col items-center">
                                        <div
                                            className={`flex items-center justify-center w-12 h-12 rounded-full border-2 ${isActive
                                                ? 'border-primary bg-primary text-primary-foreground'
                                                : isCompleted
                                                    ? 'border-primary bg-primary/10 text-primary'
                                                    : 'border-muted-foreground bg-background text-muted-foreground'
                                                }`}
                                        >
                                            <Icon className="h-6 w-6" />
                                        </div>
                                        <p className={`text-sm mt-2 ${isActive ? 'font-bold' : ''}`}>
                                            {phase.label}
                                        </p>
                                    </div>
                                    {index < phases.length - 1 && (
                                        <div
                                            className={`flex-1 h-0.5 mx-2 ${isCompleted ? 'bg-primary' : 'bg-muted'
                                                }`}
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
                <CardHeader>
                    <CardTitle>Phase Actions</CardTitle>
                    <CardDescription>Manage election phases</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {election.state === 'created' && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Ready to Start Registration</AlertTitle>
                            <AlertDescription>
                                Before starting registration, ensure all election details are correct and voters are approved.
                            </AlertDescription>
                        </Alert>
                    )}

                    {election.state === 'registration' && (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Registration Phase Active</AlertTitle>
                            <AlertDescription>
                                Add eligible voters to this election. Start voting when ready.
                            </AlertDescription>
                        </Alert>
                    )}

                    {election.state === 'voting' && (
                        <Alert className="border-green-200 bg-green-50">
                            <Vote className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-900">Voting in Progress</AlertTitle>
                            <AlertDescription className="text-green-800">
                                {election.totalVotesCast} out of {election.totalVotersRegistered} voters have cast their vote.
                            </AlertDescription>
                        </Alert>
                    )}

                    {election.state === 'ended' && (
                        <Alert className="border-blue-200 bg-blue-50">
                            <CheckCircle className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-900">Election Ended</AlertTitle>
                            <AlertDescription className="text-blue-800">
                                Final results are available below.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="flex flex-wrap gap-3">
                        {election.state === 'created' && (
                            <Button
                                onClick={() => setShowStartRegistrationDialog(true)}
                                disabled={startRegistrationMutation.isPending}
                            >
                                {startRegistrationMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <Play className="mr-2 h-4 w-4" />
                                Start Registration Phase
                            </Button>
                        )}

                        {election.state === 'registration' && (
                            <Button
                                onClick={() => setShowStartVotingDialog(true)}
                                disabled={startVotingMutation.isPending}
                            >
                                {startVotingMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <Play className="mr-2 h-4 w-4" />
                                Start Voting Phase
                            </Button>
                        )}

                        {election.state === 'voting' && (
                            <Button
                                variant="destructive"
                                onClick={() => setShowEndDialog(true)}
                                disabled={endElectionMutation.isPending}
                            >
                                {endElectionMutation.isPending && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                <Square className="mr-2 h-4 w-4" />
                                End Election
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <Calendar className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                                <p className="text-sm">{format(new Date(election.startTime), 'PPP')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <Clock className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">End Date</p>
                                <p className="text-sm">{format(new Date(election.endTime), 'PPP')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <Users className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Eligible Voters</p>
                                <p className="text-sm font-bold">{election.totalVotersRegistered}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center space-x-3">
                            <Vote className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Votes Cast</p>
                                <p className="text-sm font-bold">{election.totalVotesCast}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Turnout */}
            <Card>
                <CardHeader>
                    <CardTitle>Voter Turnout</CardTitle>
                    <CardDescription>
                        {election.totalVotesCast} out of {election.totalVotersRegistered} eligible voters
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Progress value={turnoutPercentage} className="h-2" />
                    <p className="text-sm text-muted-foreground mt-2">
                        {turnoutPercentage.toFixed(1)}% voter turnout
                    </p>
                </CardContent>
            </Card>

            {/* Candidates */}
            <Card>
                <CardHeader>
                    <CardTitle>Candidates</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {election.candidates.map((candidate) => {
                            const candidateVotes = results?.results.find(r => r.candidateId === candidate.id);

                            return (
                                <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg">
                                    <div className="flex-1">
                                        <p className="font-medium">{candidate.name}</p>
                                        {candidate.party && (
                                            <Badge variant="outline" className="mt-1">{candidate.party}</Badge>
                                        )}
                                        {candidate.description && (
                                            <p className="text-sm text-muted-foreground mt-1">{candidate.description}</p>
                                        )}
                                    </div>
                                    {election.state === 'ended' && candidateVotes && (
                                        <div className="text-right ml-4">
                                            <p className="text-2xl font-bold">{candidateVotes.votes}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {candidateVotes.percentage?.toFixed(1)}% votes
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Results Charts */}
            {election.state === 'ended' && results && chartData.length > 0 && (
                <>
                    {/* Bar Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Results - Bar Chart</CardTitle>
                            <CardDescription>Votes received by each candidate</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="votes" fill="hsl(var(--primary))" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Pie Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Results - Distribution</CardTitle>
                            <CardDescription>Percentage distribution of votes</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={(entry) => {
                                            const item = chartData.find(d => d.name === entry.name);
                                            return `${entry.name}: ${item?.percentage?.toFixed(1) || 0}%`;
                                        }}

                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="votes"
                                    >
                                        {chartData.map((index: any) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Winner Announcement */}
                    {chartData.length > 0 && (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <AlertTitle className="text-green-900">Winner Declared</AlertTitle>
                            <AlertDescription className="text-green-800">
                                <strong>{chartData[0].name}</strong> has won the election with{' '}
                                <strong>{chartData[0].votes} votes</strong> ({chartData[0].percentage.toFixed(1)}%)
                            </AlertDescription>
                        </Alert>
                    )}
                </>
            )}

            {/* Dialogs */}
            <AlertDialog open={showStartRegistrationDialog} onOpenChange={setShowStartRegistrationDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Start Registration Phase</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will open the election for voter registration. You'll be able to add eligible voters to this election.
                            <br /><br />
                            This action will be recorded on the blockchain and may take a few seconds.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={startRegistrationMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStartRegistration}
                            disabled={startRegistrationMutation.isPending}
                        >
                            {startRegistrationMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Start Registration
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showStartVotingDialog} onOpenChange={setShowStartVotingDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Start Voting Phase</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will open the election for voting. Make sure you have added all eligible voters.
                            <br /><br />
                            Current eligible voters: <strong>{election.totalVotersRegistered}</strong>
                            <br /><br />
                            This action will be recorded on the blockchain and may take a few seconds.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={startVotingMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleStartVoting}
                            disabled={startVotingMutation.isPending}
                        >
                            {startVotingMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            Start Voting
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <AlertDialog open={showEndDialog} onOpenChange={setShowEndDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>End Election</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently end the election and fetch final results from the blockchain.
                            <br /><br />
                            Current votes cast: <strong>{election.totalVotesCast}</strong> out of{' '}
                            <strong>{election.totalVotersRegistered}</strong> eligible voters
                            <br /><br />
                            <strong>This action cannot be undone.</strong>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={endElectionMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleEndElection}
                            disabled={endElectionMutation.isPending}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {endElectionMutation.isPending && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            )}
                            End Election
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};
