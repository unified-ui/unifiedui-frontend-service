import type { FC } from 'react';
import { Alert, Text } from '@mantine/core';
import { IconShieldX } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import styles from './AccessDeniedBanner.module.css';

export interface AccessDeniedBannerProps {
  requiredRoles?: string[];
  message?: string;
  compact?: boolean;
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  TENANT_GLOBAL_ADMIN: 'Tenant Admin',
  CHAT_AGENTS_ADMIN: 'Chat Agents Admin',
  CHAT_AGENTS_CREATOR: 'Chat Agents Creator',
  CREDENTIALS_ADMIN: 'Credentials Admin',
  CREDENTIALS_CREATOR: 'Credentials Creator',
  WORKFLOWS_ADMIN: 'Workflows Admin',
  WORKFLOWS_CREATOR: 'Workflows Creator',
  CONVERSATIONS_ADMIN: 'Conversations Admin',
  CONVERSATIONS_CREATOR: 'Conversations Creator',
  CUSTOM_GROUPS_ADMIN: 'Custom Groups Admin',
  CUSTOM_GROUP_CREATOR: 'Custom Groups Creator',
  CHAT_WIDGETS_ADMIN: 'Chat Widgets Admin',
  CHAT_WIDGETS_CREATOR: 'Chat Widgets Creator',
  TENANT_AI_MODELS_ADMIN: 'AI Models Admin',
  EXTERNAL_APPS_ADMIN: 'External Apps Admin',
  EXTERNAL_APPS_CREATOR: 'External Apps Creator',
  ORGANISATION_GLOBAL_ADMIN: 'Organization Admin',
  ORGANISATION_TENANT_ADMIN: 'Organization Tenant Admin',
  ORGANISATION_TENANT_CREATOR: 'Organization Tenant Creator',
  READER: 'Reader',
};

function formatRoleName(role: string): string {
  return ROLE_DISPLAY_NAMES[role] || role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export const AccessDeniedBanner: FC<AccessDeniedBannerProps> = ({
  requiredRoles,
  message,
  compact = false,
}) => {
  const { t } = useTranslation('common');

  const displayRoles = requiredRoles?.map(formatRoleName);

  return (
    <Alert
      color="orange"
      icon={<IconShieldX size={compact ? 18 : 22} />}
      title={t('accessDenied.title')}
      className={compact ? styles.compact : styles.banner}
      variant="light"
    >
      <Text size={compact ? 'xs' : 'sm'}>
        {message || t('accessDenied.message')}
      </Text>
      {displayRoles && displayRoles.length > 0 && (
        <Text size={compact ? 'xs' : 'sm'} mt={4} fw={500}>
          {t('accessDenied.requiredRoles')}: {displayRoles.join(', ')}
        </Text>
      )}
    </Alert>
  );
};
