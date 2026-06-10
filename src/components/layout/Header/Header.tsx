import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Group, TextInput, ActionIcon, Avatar, Text, Title, useMantineColorScheme, Stack, Paper, Button, Divider } from '@mantine/core';
import { IconSearch, IconBrain, IconSun, IconMoon, IconLogout, IconPlus, IconBuilding, IconSwitchHorizontal, IconUser, IconBell } from '@tabler/icons-react';
import { useAuth } from '../../../auth';
import { useIdentity } from '../../../contexts';
import { useNotifications } from '../../../contexts/useNotifications';
import { useKeyboardShortcuts } from '../../../hooks';
import { APP_TITLE, SHOW_PLATFORM_SUBTITLE } from '../../../config';
import { useBranding } from '../../../hooks/useBranding';
import { CreateTenantDialog } from '../../dialogs';
import { CreateOrganizationDialog } from '../../dialogs';
import { CommandPalette, FilterableSelect } from '../../common';
import { NotificationDrawer } from '../../common/NotificationDrawer';
import classes from './Header.module.css';

export const Header: FC = () => {
  const { t } = useTranslation('header');
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { account, logout, switchAccount } = useAuth();
  const { user, isSystemAdmin, organization, tenants, selectedTenant, selectTenant } = useIdentity();
  const branding = useBranding();
  const { unreadCount, isDrawerOpen, openDrawer, closeDrawer } = useNotifications();
  const isDark = colorScheme === 'dark';
  const [userDropdownOpened, setUserDropdownOpened] = useState(false);
  const [isTenantDialogOpen, setIsTenantDialogOpen] = useState(false);
  const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false);
  const [orgDialogDismissed, setOrgDialogDismissed] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const userAccountRef = useRef<HTMLDivElement>(null);

  const handleOpenCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);

  const handleFocusSearch = useCallback(() => setIsCommandPaletteOpen(true), []);

  useKeyboardShortcuts({
    onCommandPalette: () => setIsCommandPaletteOpen(prev => !prev),
    onFocusSearch: handleFocusSearch,
    onOpenSettings: () => navigate('/tenant-settings'),
  });

  // Auto-show create org dialog for sys admin without organization
  const shouldShowOrgDialog = useMemo(
    () => isSystemAdmin && !organization && !!user && !orgDialogDismissed,
    [isSystemAdmin, organization, user, orgDialogDismissed],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      if (userAccountRef.current && !userAccountRef.current.contains(target)) {
        const isPortalElement = (target as Element).closest?.('[data-portal]');

        if (!isPortalElement) {
          setUserDropdownOpened(false);
        }
      }
    };

    if (userDropdownOpened) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpened]);

  const userName = user?.display_name || account?.name || 'User';
  const userEmail = user?.mail || account?.username || 'user@example.com';
  const displayName = userName.length > 20 ? userName.substring(0, 20) + '…' : userName;

  const tenantDisplayName = selectedTenant?.name || t('noTenant');
  const tenantOptions = tenants.length > 0
    ? tenants.map(t => ({ value: t.id, label: t.name }))
    : [{ value: '', label: t('noTenantsAvailable') }];

  const handleTenantChange = (value: string | null) => {
    if (value && value !== '') {
      selectTenant(value);
      navigate('/dashboard');
    }
  };

  return (
    <header className={classes.header}>
      <Group gap="sm" className={classes.logo} onClick={() => navigate('/dashboard')}>
        <div className={classes.logoWrapper}>
          {branding.iconUrl ? (
            <img src={branding.iconUrl} alt="" className={classes.logoIcon} />
          ) : (
            <IconBrain size={22} stroke={2} />
          )}
        </div>
        <div className={classes.logoTextWrapper}>
          <Title order={2} className={classes.logoText}>
            {APP_TITLE}
          </Title>
          {SHOW_PLATFORM_SUBTITLE && (
            <span className={classes.logoSubtitle}>powered by unified-ui</span>
          )}
        </div>
      </Group>

      <TextInput
        className={classes.search}
        placeholder={t('searchPlaceholder')}
        leftSection={<IconSearch size={16} />}
        rightSection={<span className={classes.searchKbd}>⌘K</span>}
        radius="xl"
        readOnly
        onClick={handleOpenCommandPalette}
        style={{ cursor: 'pointer' }}
      />

      <Group gap="md">
        <ActionIcon
          variant="subtle"
          size="lg"
          radius="xl"
          onClick={() => openDrawer()}
          aria-label="Notifications"
          className={classes.bellIcon}
        >
          <IconBell size={20} />
          {unreadCount > 0 && (
            <span className={classes.bellBadge}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </ActionIcon>

        <ActionIcon
          variant="subtle"
          size="lg"
          radius="xl"
          onClick={() => toggleColorScheme()}
          aria-label={isDark ? t('switchToLight') : t('switchToDark')}
          title={isDark ? t('switchToLight') : t('switchToDark')}
        >
          {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>

        <div ref={userAccountRef} className={classes.userAccountWrapper}>
          <Group
            gap="xs"
            className={classes.userAccount}
            onClick={() => setUserDropdownOpened(!userDropdownOpened)}
          >
            <Avatar radius="xl" size="md" color="primary" />
            <Stack gap={0}>
              <Text size="sm" fw={700}>{displayName}</Text>
              <Text size="xs" c="dimmed">{tenantDisplayName}</Text>
            </Stack>
          </Group>

          {userDropdownOpened && (
            <Paper
              className={classes.userDropdown}
              shadow="md"
              radius="md"
              p="md"
              onClick={(e) => e.stopPropagation()}
            >
              <Stack gap="md">
                <Stack gap={4}>
                  <Text size="sm" fw={700}>{userName}</Text>
                  <Text size="xs" c="dimmed">{userEmail}</Text>
                </Stack>

                <Divider />

                <Stack gap="xs">
                  <Text size="xs" fw={700}>{t('tenantLabel')}</Text>
                  <FilterableSelect
                    data={tenantOptions}
                    value={selectedTenant?.id || null}
                    onChange={handleTenantChange}
                    size="xs"
                    placeholder={t('selectTenant')}
                    disabled={tenants.length === 0}
                  />
                </Stack>

                {selectedTenant && (
                  <Stack gap={4}>
                    <Text size="xs" fw={700}>{t('tenantId')}</Text>
                    <Text size="xs" c="dimmed" style={{ wordBreak: 'break-all' }}>
                      {selectedTenant.id}
                    </Text>
                  </Stack>
                )}

                <Button
                  leftSection={<IconPlus size={14} />}
                  variant="subtle"
                  size="xs"
                  fullWidth
                  onClick={() => setIsTenantDialogOpen(true)}
                >
                  {t('addTenant')}
                </Button>

                {isSystemAdmin && !organization && (
                  <Button
                    leftSection={<IconBuilding size={14} />}
                    variant="light"
                    color="blue"
                    size="xs"
                    fullWidth
                    onClick={() => setIsOrgDialogOpen(true)}
                  >
                    {t('setupOrganization')}
                  </Button>
                )}

                <Divider />

                <Button
                  leftSection={<IconUser size={16} />}
                  variant="subtle"
                  fullWidth
                  onClick={() => {
                    setUserDropdownOpened(false);
                    navigate('/user/settings');
                  }}
                >
                  {t('mySettings')}
                </Button>

                <Button
                  leftSection={<IconSwitchHorizontal size={16} />}
                  variant="subtle"
                  fullWidth
                  onClick={switchAccount}
                >
                  {t('switchAccount')}
                </Button>

                <Button
                  leftSection={<IconLogout size={16} />}
                  variant="light"
                  color="red"
                  fullWidth
                  onClick={logout}
                >
                  {t('logout')}
                </Button>
              </Stack>
            </Paper>
          )}
        </div>
      </Group>

      <CreateTenantDialog
        opened={isTenantDialogOpen}
        onClose={() => setIsTenantDialogOpen(false)}
      />

      <CreateOrganizationDialog
        opened={isOrgDialogOpen || shouldShowOrgDialog}
        onClose={() => {
          setIsOrgDialogOpen(false);
          setOrgDialogDismissed(true);
        }}
      />

      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
      />

      <NotificationDrawer
        opened={isDrawerOpen}
        onClose={closeDrawer}
      />
    </header>
  );
};
