import type { FC, ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Center, Loader } from '@mantine/core';
import { useAuth } from '../auth';
import { useIdentity } from '../contexts';

interface ProtectedRouteProps {
  children: ReactNode;
}

export const ProtectedRoute: FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const { user, isSystemAdmin, organization, tenants, isLoading: identityLoading } = useIdentity();
  const location = useLocation();

  if (isLoading || identityLoading || (isAuthenticated && !user)) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    const redirectUrl = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirectUrl}`} replace />;
  }

  if (!isSystemAdmin && !organization && tenants.length === 0) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};
