import type { FC, ReactNode } from 'react';
import { Center, Loader } from '@mantine/core';
import { useAuth } from '../auth';
import { useIdentity } from '../contexts';
import { usePermissions } from '../hooks/usePermissions';
import { ProtectedRoute } from './ProtectedRoute';
import { MainLayout } from '../components/layout/MainLayout';
import { AccessDeniedBanner } from '../components/common';

interface AdminProtectedRouteProps {
  children: ReactNode;
}

export const AdminProtectedRoute: FC<AdminProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { user, isLoading: identityLoading } = useIdentity();
  const { isGlobalAdmin } = usePermissions();

  if (authLoading || identityLoading || (isAuthenticated && !user)) {
    return (
      <Center h="100vh">
        <Loader size="xl" />
      </Center>
    );
  }

  if (!isGlobalAdmin) {
    return (
      <ProtectedRoute>
        <MainLayout>
          <AccessDeniedBanner requiredRoles={['TENANT_GLOBAL_ADMIN']} />
        </MainLayout>
      </ProtectedRoute>
    );
  }

  return <ProtectedRoute>{children}</ProtectedRoute>;
};
