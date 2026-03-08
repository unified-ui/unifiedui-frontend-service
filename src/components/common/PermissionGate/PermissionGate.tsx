import { Children, cloneElement, isValidElement } from 'react';
import type { FC, ReactNode, ReactElement } from 'react';
import { Tooltip } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../../hooks';
import type { TenantPermissionEnum, PermissionActionEnum } from '../../../api/types';

export interface PermissionGateProps {
  children: ReactNode;
  requiredRole?: TenantPermissionEnum;
  requiredRoles?: TenantPermissionEnum[];
  permission?: PermissionActionEnum | null;
  requiredAction?: 'READ' | 'WRITE' | 'ADMIN';
  mode?: 'hide' | 'disable';
  fallback?: ReactNode;
  tooltip?: string;
}

export const PermissionGate: FC<PermissionGateProps> = ({
  children,
  requiredRole,
  requiredRoles,
  permission,
  requiredAction = 'READ',
  mode = 'hide',
  fallback = null,
  tooltip,
}) => {
  const { t } = useTranslation('common');
  const { hasRole, hasAnyRole, canRead, canWrite, canAdmin } = usePermissions();

  let allowed = true;

  if (requiredRole) {
    allowed = hasRole(requiredRole);
  } else if (requiredRoles && requiredRoles.length > 0) {
    allowed = hasAnyRole(requiredRoles);
  }

  if (allowed && permission !== undefined) {
    switch (requiredAction) {
      case 'READ':
        allowed = canRead(permission);
        break;
      case 'WRITE':
        allowed = canWrite(permission);
        break;
      case 'ADMIN':
        allowed = canAdmin(permission);
        break;
    }
  }

  if (allowed) {
    return <>{children}</>;
  }

  if (mode === 'hide') {
    return <>{fallback}</>;
  }

  const tooltipLabel = tooltip || t('noPermission');

  return (
    <Tooltip label={tooltipLabel} withArrow>
      <span style={{ display: 'contents' }}>
        {Children.map(children, child => {
          if (isValidElement(child)) {
            return cloneElement(child as ReactElement<Record<string, unknown>>, { disabled: true });
          }
          return child;
        })}
      </span>
    </Tooltip>
  );
};
