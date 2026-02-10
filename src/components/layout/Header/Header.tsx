import type { FC } from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Group, TextInput, ActionIcon, Avatar, Text, Title, useMantineColorScheme, Stack, Paper, Button, Divider, Select } from '@mantine/core';
import { IconSearch, IconBrain, IconSun, IconMoon, IconLogout, IconPlus } from '@tabler/icons-react';
import { useAuth } from '../../../auth';
import { useIdentity } from '../../../contexts';
import { useKeyboardShortcuts } from '../../../hooks';
import { CreateTenantDialog } from '../../dialogs';
import { CommandPalette } from '../../common';
import classes from './Header.module.css';

export const Header: FC = () => {
  const { t } = useTranslation('header');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { account, logout } = useAuth();
  const { user, tenants, selectedTenant, selectTenant } = useIdentity();
  const isDark = colorScheme === 'dark';
  const [userDropdownOpened, setUserDropdownOpened] = useState(false);
  const [isTenantDialogOpen, setIsTenantDialogOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const userAccountRef = useRef<HTMLDivElement>(null);

  const handleOpenCommandPalette = useCallback(() => setIsCommandPaletteOpen(true), []);

  const handleFocusSearch = useCallback(() => setIsCommandPaletteOpen(true), []);

  useKeyboardShortcuts({
    onCommandPalette: () => setIsCommandPaletteOpen(prev => !prev),
    onFocusSearch: handleFocusSearch,
    onOpenSettings: () => navigate('/tenant-settings'),
  });

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
          <IconBrain size={22} stroke={2} />
        </div>
        <Title order={2} className={classes.logoText}>
          unified-ui
        </Title>
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
                  <Select
                    data={tenantOptions}
                    value={selectedTenant?.id || null}
                    onChange={handleTenantChange}
                    searchable
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

                <Divider />

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

      <CommandPalette
        open={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
      />
    </header>
  );
};
