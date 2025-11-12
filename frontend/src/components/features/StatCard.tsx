import { Card, CardContent } from '@/components/ui/card';
import { type LucideIcon } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    description?: string;
    icon: LucideIcon;
    iconColor?: string;
}

export const StatCard = ({ title, value, description, icon: Icon, iconColor = 'text-primary' }: StatCardProps) => {
    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-center justify-between space-x-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{title}</p>
                        <p className="text-2xl font-bold">{value}</p>
                        {description && <p className="text-xs text-muted-foreground">{description}</p>}
                    </div>
                    <div className={`rounded-full bg-primary/10 p-3`}>
                        <Icon className={`h-6 w-6 ${iconColor}`} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
