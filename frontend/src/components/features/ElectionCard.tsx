import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Vote } from 'lucide-react';
import { type Election } from '@/types';
import { format } from 'date-fns';

interface ElectionCardProps {
    election: Election;
}

export const ElectionCard = ({ election }: ElectionCardProps) => {
    const getStateBadge = (state: string) => {
        const badges = {
            created: { variant: 'secondary' as const, label: 'Created' },
            registration: { variant: 'default' as const, label: 'Registration Open' },
            voting: { variant: 'default' as const, label: 'Voting Active' },
            ended: { variant: 'outline' as const, label: 'Ended' },
        };
        return badges[state as keyof typeof badges] || badges.created;
    };

    const badge = getStateBadge(election.state);

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                        <CardTitle className="text-xl">{election.title}</CardTitle>
                        <CardDescription className="line-clamp-2">{election.description}</CardDescription>
                    </div>
                    <Badge variant={badge.variant}>{badge.label}</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-muted-foreground">
                    <Calendar className="mr-2 h-4 w-4" />
                    <span>{format(new Date(election.startTime), 'PPP')}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Ends: {format(new Date(election.endTime), 'PPP')}</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{election.candidates.length} Candidates</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                    <Vote className="mr-2 h-4 w-4" />
                    <span>{election.totalVotesCast} / {election.totalVotersRegistered} Votes Cast</span>
                </div>
            </CardContent>
            <CardFooter>
                <Button asChild className="w-full">
                    <Link to={`/voter/elections/${election._id}`}>
                        View Details
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    );
};
