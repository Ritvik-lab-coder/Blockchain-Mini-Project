import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { votingApi } from '@/api/voting.api';
import { CheckCircle2, XCircle, Search, Calendar, Hash } from 'lucide-react';
import { format } from 'date-fns';

export const VerifyVote = () => {
    const [searchParams] = useSearchParams();
    const txFromUrl = searchParams.get('tx') || '';

    const [transactionHash, setTransactionHash] = useState(txFromUrl);
    const [verificationResult, setVerificationResult] = useState<any>(null);

    const verifyMutation = useMutation({
        mutationFn: (txHash: string) => votingApi.verifyVote(txHash),
        onSuccess: (data) => {
            setVerificationResult(data);
        },
        onError: (error: any) => {
            setVerificationResult({
                exists: false,
                error: error.response?.data?.message || 'Verification failed',
            });
        },
    });

    const handleVerify = () => {
        if (!transactionHash.trim()) return;
        setVerificationResult(null);
        verifyMutation.mutate(transactionHash.trim());
    };

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold">Verify Vote</h1>
                <p className="text-muted-foreground">Verify that your vote was recorded on the blockchain</p>
            </div>

            {/* Input Card */}
            <Card>
                <CardHeader>
                    <CardTitle>Enter Transaction Hash</CardTitle>
                    <CardDescription>
                        Enter the transaction hash you received after casting your vote
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="txHash">Transaction Hash</Label>
                        <Input
                            id="txHash"
                            placeholder="0x..."
                            value={transactionHash}
                            onChange={(e) => setTransactionHash(e.target.value)}
                            disabled={verifyMutation.isPending}
                        />
                    </div>
                    <Button
                        onClick={handleVerify}
                        disabled={!transactionHash.trim() || verifyMutation.isPending}
                        className="w-full"
                    >
                        {verifyMutation.isPending ? (
                            'Verifying...'
                        ) : (
                            <>
                                <Search className="mr-2 h-4 w-4" />
                                Verify Vote
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Verification Result */}
            {verificationResult && (
                <>
                    {verificationResult.exists ? (
                        <Alert className="border-green-200 bg-green-50">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <AlertTitle className="text-green-900">Vote Verified Successfully</AlertTitle>
                            <AlertDescription className="text-green-800">
                                Your vote has been verified on the blockchain
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <Alert variant="destructive">
                            <XCircle className="h-5 w-5" />
                            <AlertTitle>Verification Failed</AlertTitle>
                            <AlertDescription>
                                {verificationResult.error || 'Vote not found on the blockchain'}
                            </AlertDescription>
                        </Alert>
                    )}

                    {verificationResult.exists && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Vote Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Status</span>
                                    <Badge variant="outline" className="bg-green-50">
                                        <CheckCircle2 className="mr-1 h-3 w-3" />
                                        Verified
                                    </Badge>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        <Calendar className="inline mr-1 h-3 w-3" />
                                        Timestamp
                                    </p>
                                    <p className="text-sm">
                                        {format(new Date(verificationResult.timestamp), 'PPP p')}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">
                                        <Hash className="inline mr-1 h-3 w-3" />
                                        Election
                                    </p>
                                    <p className="text-sm">{verificationResult.election}</p>
                                </div>

                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Nullifier</p>
                                    <p className="text-xs font-mono break-all text-muted-foreground">
                                        {verificationResult.nullifier}
                                    </p>
                                </div>

                                <Alert>
                                    <AlertTitle>Privacy Protected</AlertTitle>
                                    <AlertDescription>
                                        While your vote is verified, the candidate you voted for remains private thanks to zero-knowledge proofs.
                                    </AlertDescription>
                                </Alert>
                            </CardContent>
                        </Card>
                    )}
                </>
            )}
        </div>
    );
};
