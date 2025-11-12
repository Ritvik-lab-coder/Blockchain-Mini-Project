import { Navigate, type RouteObject } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Login } from '@/pages/auth/Login';
import { Register } from '@/pages/auth/Register';
import { NotFound } from '@/pages/NotFound';
import { Unauthorized } from '@/pages/Unauthorized';
import { MainLayout } from '@/components/layout/MainLayout';

// Import Voter Pages
import { VoterDashboard } from '@/pages/voter/Dashboard';
import { Elections } from '@/pages/voter/Elections';
import { ElectionDetails } from '@/pages/voter/ElectionDetails';
import { History } from '@/pages/voter/History';
import { VerifyVote } from '@/pages/voter/VerifyVote';

// Import Admin Pages
import { AdminDashboard } from '@/pages/admin/Dashboard';
import { Voters } from '@/pages/admin/Voters';
import { AdminElections } from '@/pages/admin/Elections';
import { CreateElection } from '@/pages/admin/CreateElection';
import { AdminElectionDetails } from '@/pages/admin/ElectionDetails';
import { AuditLogs } from '@/pages/admin/AuditLogs';

// Protected Route Component
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'voter' | 'observer';
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Public Route (redirect if authenticated)
export const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/voter" replace />;
  }

  return <>{children}</>;
};

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <Navigate to="/login" replace />,
  },
  {
    path: '/login',
    element: (
      <PublicRoute>
        <Login />
      </PublicRoute>
    ),
  },
  {
    path: '/register',
    element: (
      <PublicRoute>
        <Register />
      </PublicRoute>
    ),
  },
  // Voter Routes
  {
    path: '/voter',
    element: (
      <ProtectedRoute requiredRole="voter">
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <VoterDashboard />,
      },
      {
        path: 'elections',
        element: <Elections />,
      },
      {
        path: 'elections/:electionId',
        element: <ElectionDetails />,
      },
      {
        path: 'history',
        element: <History />,
      },
      {
        path: 'verify',
        element: <VerifyVote />,
      },
    ],
  },
  // Admin Routes
  {
    path: '/admin',
    element: (
      <ProtectedRoute requiredRole="admin">
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <AdminDashboard />,
      },
      {
        path: 'voters',
        element: <Voters />,
      },
      {
        path: 'elections',
        element: <AdminElections />,
      },
      {
        path: 'elections/create',
        element: <CreateElection />,
      },
      {
        path: 'elections/:electionId',
        element: <AdminElectionDetails />,
      },
      {
        path: 'logs',
        element: <AuditLogs />,
      },
    ],
  },
  {
    path: '/unauthorized',
    element: <Unauthorized />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
];
