import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useElection, useCanVote, useCastVote } from '@/hooks/useElections';
import { electionApi } from '@/api/election.api';
import { queryKeys } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
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
import { CandidateCard } from '@/components/features/CandidateCard';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Calendar, Clock, Users, Vote, CheckCircle2, AlertCircle, ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const ElectionDetails = () => {
  const { electionId } = useParams<{ electionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [selectedCandidate, setSelectedCandidate] = useState<number | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const { data: election, isLoading: electionLoading } = useElection(electionId!);
  
  // Check registration status
  const { data: registrationStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['election-registration', electionId],
    queryFn: () => electionApi.checkRegistration(electionId!),
    enabled: !!electionId,
  });

  const castVoteMutation = useCastVote();

  // Register for election mutation
  const registerMutation = useMutation({
    mutationFn: () => electionApi.registerForElection(electionId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['election-registration', electionId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.election(electionId!) });
      toast.success('Successfully registered for election!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to register for election');
    },
  });

  const handleRegisterForElection = () => {
    registerMutation.mutate();
  };

  const handleVoteClick = () => {
    if (selectedCandidate === null) {
      toast.error('Please select a candidate');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmVote = async () => {
    if (selectedCandidate === null || !electionId) return;

    setIsVoting(true);
    setShowConfirmDialog(false);

    try {
      await castVoteMutation.mutateAsync({
        electionId,
        candidateId: selectedCandidate,
      });
      
      toast.success('Vote cast successfully!', {
        description: 'Your vote has been recorded on the blockchain',
      });
      
      setTimeout(() => {
        navigate('/voter/history');
      }, 2000);
    } catch (error) {
      setIsVoting(false);
    }
  };

  if (electionLoading || statusLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" text="Loading election details..." />
      </div>
    );
  }

  if (!election) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Election not found</p>
        <Button onClick={() => navigate('/voter/elections')} className="mt-4">
          Back to Elections
        </Button>
      </div>
    );
  }

  const isRegistered = registrationStatus?.isRegistered || false;
  const hasVoted = registrationStatus?.hasVoted || false;
  const canVote = registrationStatus?.canVote || false;
  const isActive = election.state === 'voting';
  const isRegistrationOpen = election.state === 'registration';

  const turnoutPercentage = election.totalVotersRegistered > 0
    ? (election.totalVotesCast / election.totalVotersRegistered) * 100
    : 0;

  const selectedCandidateName = selectedCandidate !== null
    ? election.candidates.find(c => c.id === selectedCandidate)?.name
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => navigate('/voter/elections')} className="mb-4">
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

      {/* Voting Progress Bar */}
      {isVoting && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Processing Your Vote</AlertTitle>
          <AlertDescription>
            Generating zero-knowledge proof and submitting to blockchain. This may take 10-15 seconds...
          </AlertDescription>
          <Progress value={undefined} className="mt-2" />
        </Alert>
      )}

      {/* Registration Status */}
      {isRegistrationOpen && !isRegistered && (
        <Alert>
          <UserPlus className="h-4 w-4" />
          <AlertTitle>Registration Open</AlertTitle>
          <AlertDescription className="flex items-center justify-between">
            <span>Register for this election to be eligible to vote when voting starts.</span>
            <Button 
              onClick={handleRegisterForElection}
              disabled={registerMutation.isPending}
              size="sm"
              className="ml-4"
            >
              {registerMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Register Now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {isRegistered && !isActive && !hasVoted && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Registered Successfully</AlertTitle>
          <AlertDescription>
            You are registered for this election. Voting will open soon.
          </AlertDescription>
        </Alert>
      )}

      {!isRegistered && !isRegistrationOpen && election.state !== 'ended' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Not Registered</AlertTitle>
          <AlertDescription>
            You are not registered for this election. Registration period has closed.
          </AlertDescription>
        </Alert>
      )}

      {hasVoted && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Vote Recorded</AlertTitle>
          <AlertDescription className="text-green-800">
            Your vote has been successfully recorded on the blockchain.
          </AlertDescription>
        </Alert>
      )}

      {canVote && isActive && !hasVoted && (
        <Alert>
          <Vote className="h-4 w-4" />
          <AlertTitle>You Can Vote!</AlertTitle>
          <AlertDescription>Select a candidate below to cast your vote</AlertDescription>
        </Alert>
      )}

      {/* Election Info */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                <p className="text-sm font-medium text-muted-foreground">Registered Voters</p>
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
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Voter Turnout</CardTitle>
            <CardDescription>
              {election.totalVotesCast} out of {election.totalVotersRegistered} eligible voters have cast their vote
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={turnoutPercentage} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">{turnoutPercentage.toFixed(1)}% turnout</p>
          </CardContent>
        </Card>
      )}

      {/* Candidates */}
      <div>
        <h2 className="text-2xl font-bold mb-4">Candidates</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {election.candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              selected={selectedCandidate === candidate.id}
              onSelect={() => canVote && !isVoting && setSelectedCandidate(candidate.id)}
              disabled={!canVote || isVoting || hasVoted}
            />
          ))}
        </div>
      </div>

      {/* Vote Button */}
      {canVote && isActive && !hasVoted && (
        <div className="flex justify-center">
          <Button
            size="lg"
            onClick={handleVoteClick}
            disabled={selectedCandidate === null || isVoting}
            className="w-full md:w-auto"
          >
            {isVoting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing Vote...
              </>
            ) : (
              <>
                <Vote className="mr-2 h-5 w-5" />
                Cast Your Vote
              </>
            )}
          </Button>
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Your Vote</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to vote for <strong>{selectedCandidateName}</strong>.
              <br /><br />
              This action cannot be undone. Your vote will be recorded on the blockchain with zero-knowledge proof to ensure privacy and integrity.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isVoting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmVote} disabled={isVoting}>
              Confirm Vote
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
