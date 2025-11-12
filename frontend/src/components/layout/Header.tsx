import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuthStore } from '@/store/authStore';
import { LogOut, User as UserIcon, Shield, Vote } from 'lucide-react';
import { authApi } from '@/api/auth.api';
import { toast } from 'sonner';

export const Header = () => {
    const { user, clearAuth } = useAuthStore();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await authApi.logout();
            clearAuth();
            toast.success('Logged out successfully');
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            clearAuth();
            navigate('/login');
        }
    };

    const getInitials = (firstName: string, lastName: string) => {
        return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                {/* Logo and Brand */}
                <Link to={user?.role === 'admin' ? '/admin' : '/voter'} className="flex items-center space-x-2">
                    <Vote className="h-6 w-6 text-primary" />
                    <span className="font-bold text-xl">BlockVote</span>
                </Link>

                {/* User Menu */}
                <div className="flex items-center space-x-4">
                    {user && (
                        <>
                            <span className="text-sm text-muted-foreground hidden md:inline">
                                {user.firstName} {user.lastName}
                            </span>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                                        <Avatar>
                                            <AvatarFallback className="bg-primary text-primary-foreground">
                                                {getInitials(user.firstName, user.lastName)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="end">
                                    <DropdownMenuLabel>
                                        <div className="flex flex-col space-y-1">
                                            <p className="text-sm font-medium">
                                                {user.firstName} {user.lastName}
                                            </p>
                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                            <div className="flex items-center pt-1">
                                                {user.role === 'admin' ? (
                                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                                                        <Shield className="mr-1 h-3 w-3" />
                                                        Admin
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                        <UserIcon className="mr-1 h-3 w-3" />
                                                        Voter
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Log out</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};
