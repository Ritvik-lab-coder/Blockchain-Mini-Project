import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type Candidate } from '@/types';
import { User } from 'lucide-react';

interface CandidateCardProps {
    candidate: Candidate;
    selected?: boolean;
    onSelect?: () => void;
    disabled?: boolean;
}

export const CandidateCard = ({ candidate, selected, onSelect, disabled }: CandidateCardProps) => {
    return (
        <Card
            className={`cursor-pointer transition-all ${selected ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onSelect?.()}
        >
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="rounded-full bg-primary/10 p-2">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">{candidate.name}</CardTitle>
                            {candidate.party && (
                                <Badge variant="outline" className="mt-1">
                                    {candidate.party}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            {candidate.description && (
                <CardContent>
                    <CardDescription className="line-clamp-3">{candidate.description}</CardDescription>
                </CardContent>
            )}
        </Card>
    );
};
