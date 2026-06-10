import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Stack,
  Title,
  Text,
  Group,
  Select,
  Badge,
  CopyButton,
  ActionIcon,
  Tooltip,
  SegmentedControl,
  useMantineColorScheme,
} from '@mantine/core';
import {
  IconUser,
  IconCopy,
  IconCheck,
  IconSettings,
  IconBuildingCommunity,
} from '@tabler/icons-react';
import i18n from '../../i18n';
import { MainLayout } from '../../components/layout/MainLayout';
import { ContentCard } from '../../components/common/ContentCard';
import { useIdentity } from '../../contexts';
import classes from './UserSettingsPage.module.css';

interface InfoRowProps {
  label: string;
  value: string | null | undefined;
  copyable?: boolean;
  mono?: boolean;
}

const InfoRow: FC<InfoRowProps> = ({ label, value, copyable = false, mono = true }) => {
  const displayValue = value || '—';
  return (
    <div className={classes.field}>
      <Text className={classes.fieldLabel}>{label}</Text>
      <Group gap="xs" wrap="nowrap" justify="space-between">
        <Text className={classes.fieldValue} style={{ fontFamily: mono ? undefined : 'inherit' }}>
          {displayValue}
        </Text>
        {copyable && value && (
          <CopyButton value={value}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copied' : 'Copy'}>
                <ActionIcon size="sm" variant="subtle" onClick={copy}>
                  {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        )}
      </Group>
    </div>
  );
};

const LANGUAGE_OPTIONS = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'de-DE', label: 'Deutsch' },
];

const SUPPORTED_LANGUAGES = LANGUAGE_OPTIONS.map((o) => o.value);

const resolveLanguage = (detected: string): string => {
  if (SUPPORTED_LANGUAGES.includes(detected)) return detected;
  const prefix = detected.split('-')[0];
  return SUPPORTED_LANGUAGES.find((l) => l.startsWith(prefix)) ?? 'en-US';
};

export const UserSettingsPage: FC = () => {
  const { t } = useTranslation('common');
  const { user, isSystemAdmin, selectedTenant, selectedTenantRoles, organization } = useIdentity();
  const { colorScheme, setColorScheme } = useMantineColorScheme();

  const [currentLanguage, setCurrentLanguage] = useState<string>(() => {
    try {
      const stored = localStorage.getItem('i18nextLng');
      return resolveLanguage(stored || i18n.language || 'en-US');
    } catch {
      return resolveLanguage(i18n.language || 'en-US');
    }
  });

  useEffect(() => {
    const handler = (lng: string): void => setCurrentLanguage(resolveLanguage(lng));
    i18n.on('languageChanged', handler);
    return () => {
      i18n.off('languageChanged', handler);
    };
  }, []);

  const handleLanguageChange = (value: string | null): void => {
    if (!value) return;
    setCurrentLanguage(value);
    i18n.changeLanguage(value);
    try {
      localStorage.setItem('i18nextLng', value);
    } catch {
      // localStorage unavailable - graceful fallback
    }
  };

  const handleThemeChange = (value: string): void => {
    setColorScheme(value as 'light' | 'dark' | 'auto');
  };

  return (
    <MainLayout>
      <div className={classes.scrollContainer}>
        <div className={classes.page}>
          <Stack gap="lg">
          <Group gap="sm">
            <IconUser size={28} />
            <Title order={2}>{t('userSettings.title', 'User Settings')}</Title>
          </Group>

          <ContentCard
            title={t('userSettings.profile', 'Profile')}
            icon={<IconUser size={16} />}
            headerAction={
              <Badge variant="light" color="gray">
                {t('userSettings.readOnly', 'Read-only')}
              </Badge>
            }
          >
              <Stack gap={0}>
                <InfoRow
                  label={t('userSettings.internalId', 'Internal ID')}
                  value={user?.id}
                  copyable
                />
                <InfoRow
                  label={t('userSettings.displayName', 'Display Name')}
                  value={user?.display_name}
                  mono={false}
                />
                <InfoRow
                  label={t('userSettings.firstName', 'First Name')}
                  value={user?.firstname}
                  mono={false}
                />
                <InfoRow
                  label={t('userSettings.lastName', 'Last Name')}
                  value={user?.lastname}
                  mono={false}
                />
                <InfoRow
                  label={t('userSettings.email', 'Email')}
                  value={user?.mail}
                  copyable
                />
                <InfoRow
                  label={t('userSettings.identityProvider', 'Identity Provider')}
                  value={user?.identity_provider}
                  mono={false}
                />
                <InfoRow
                  label={t('userSettings.identityTenantId', 'Identity Tenant ID')}
                  value={user?.identity_tenant_id}
                  copyable
                />
                <div className={classes.field}>
                  <Text className={classes.fieldLabel}>
                    {t('userSettings.systemAdmin', 'System Admin')}
                  </Text>
                  <Badge color={isSystemAdmin ? 'green' : 'gray'} variant="light">
                    {isSystemAdmin ? t('userSettings.yes', 'Yes') : t('userSettings.no', 'No')}
                  </Badge>
                </div>
              </Stack>
          </ContentCard>

          <ContentCard
            title={t('userSettings.tenantContext', 'Tenant Context')}
            icon={<IconBuildingCommunity size={16} />}
          >
              <Stack gap={0}>
                <InfoRow
                  label={t('userSettings.organization', 'Organization')}
                  value={organization?.name ?? '—'}
                  mono={false}
                />
                <InfoRow
                  label={t('userSettings.currentTenant', 'Current Tenant')}
                  value={selectedTenant?.name ?? '—'}
                  mono={false}
                />
                <InfoRow
                  label={t('userSettings.currentTenantId', 'Current Tenant ID')}
                  value={selectedTenant?.id}
                  copyable
                />
                <div className={classes.field}>
                  <Text className={classes.fieldLabel}>
                    {t('userSettings.tenantRoles', 'Tenant Roles')}
                  </Text>
                  <Group gap="xs">
                    {selectedTenantRoles.length > 0 ? (
                      selectedTenantRoles.map((role) => (
                        <Badge key={role} variant="light" color="blue">
                          {role}
                        </Badge>
                      ))
                    ) : (
                      <Text c="dimmed" size="sm">
                        —
                      </Text>
                    )}
                  </Group>
                </div>
              </Stack>
          </ContentCard>

          <ContentCard
            title={t('userSettings.preferences', 'Preferences')}
            icon={<IconSettings size={16} />}
          >
              <Stack gap="md">
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {t('userSettings.language', 'Language')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t(
                      'userSettings.languageHelp',
                      'Changes the display language immediately. Persists across sessions.',
                    )}
                  </Text>
                  <Select
                    data={LANGUAGE_OPTIONS}
                    value={currentLanguage}
                    onChange={handleLanguageChange}
                    maw={280}
                  />
                </Stack>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {t('userSettings.theme', 'Theme')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t(
                      'userSettings.themeHelp',
                      'Choose light, dark, or follow the system setting.',
                    )}
                  </Text>
                  <SegmentedControl
                    value={colorScheme}
                    onChange={handleThemeChange}
                    data={[
                      { value: 'light', label: t('userSettings.themeLight', 'Light') },
                      { value: 'dark', label: t('userSettings.themeDark', 'Dark') },
                      { value: 'auto', label: t('userSettings.themeAuto', 'System') },
                    ]}
                    maw={280}
                  />
                </Stack>
              </Stack>
          </ContentCard>
        </Stack>
        </div>
      </div>
    </MainLayout>
  );
};
