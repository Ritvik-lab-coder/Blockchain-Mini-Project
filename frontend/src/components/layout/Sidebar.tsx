import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Vote,
  Users,
  ListChecks,
  History,
  ShieldCheck,
  FileText,
  Plus,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  role?: 'admin' | 'voter';
}

const navItems: NavItem[] = [
  // Voter items
  {
    title: 'Dashboard',
    href: '/voter',
    icon: LayoutDashboard,
    role: 'voter',
  },
  {
    title: 'Elections',
    href: '/voter/elections',
    icon: Vote,
    role: 'voter',
  },
  {
    title: 'Voting History',
    href: '/voter/history',
    icon: History,
    role: 'voter',
  },
  {
    title: 'Verify Vote',
    href: '/voter/verify',
    icon: ShieldCheck,
    role: 'voter',
  },
  // Admin items
  {
    title: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    role: 'admin',
  },
  {
    title: 'Voters',
    href: '/admin/voters',
    icon: Users,
    role: 'admin',
  },
  {
    title: 'Elections',
    href: '/admin/elections',
    icon: ListChecks,
    role: 'admin',
  },
  {
    title: 'Create Election',
    href: '/admin/elections/create',
    icon: Plus,
    role: 'admin',
  },
  {
    title: 'Audit Logs',
    href: '/admin/logs',
    icon: FileText,
    role: 'admin',
  },
];

export const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  const filteredNavItems = navItems.filter(
    (item) => !item.role || item.role === user?.role || user?.role === 'admin'
  );

  return (
    <aside className="hidden md:flex w-64 flex-col border-r bg-background">
      <nav className="flex-1 space-y-1 p-4">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
