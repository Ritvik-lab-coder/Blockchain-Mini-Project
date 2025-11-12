import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldAlert, Home } from 'lucide-react';

export const Unauthorized = () => {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background">
            <div className="text-center space-y-6">
                <ShieldAlert className="h-24 w-24 text-destructive mx-auto" />
                <h1 className="text-4xl font-bold">Access Denied</h1>
                <p className="text-muted-foreground max-w-md">
                    You don't have permission to access this page. Please contact an administrator if you believe this is an error.
                </p>
                <Button asChild>
                    <Link to="/">
                        <Home className="mr-2 h-4 w-4" />
                        Go Home
                    </Link>
                </Button>
            </div>
        </div>
    );
};
