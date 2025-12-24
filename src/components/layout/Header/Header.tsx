import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group, TextInput, Indicator, ActionIcon, Avatar, Text, useMantineColorScheme, Stack, Paper, Button, Divider, Select, UnstyledButton } from '@mantine/core';
import { IconSearch, IconBell, IconBrain, IconSun, IconMoon, IconLogout, IconExternalLink, IconPlus } from '@tabler/icons-react';
import { useAuth } from '../../../auth';
import { useIdentity } from '../../../contexts';
import { CreateTenantDialog } from '../../dialogs';
import classes from './Header.module.css';

export const Header: FC = () => {
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { account, logout } = useAuth();
  const { user, tenants, selectedTenant, selectTenant } = useIdentity();
  const isDark = colorScheme === 'dark';
  const [userDropdownOpened, setUserDropdownOpened] = useState(false);
  const [isTenantDialogOpen, setIsTenantDialogOpen] = useState(false);
  const userAccountRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is outside userAccountRef
      if (userAccountRef.current && !userAccountRef.current.contains(target)) {
        // Check if click is on a Mantine portal element (dropdown, select options, etc.)
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
  
  const tenantDisplayName = selectedTenant?.name || 'Kein Tenant';
  const tenantOptions = tenants.length > 0 
    ? tenants.map(t => ({ value: t.id, label: t.name }))
    : [{ value: '', label: 'Keine Tenants verfügbar' }];

  const handleTenantChange = (value: string | null) => {
    if (value && value !== '') {
      selectTenant(value);
    }
  };

  return (
    <header className={classes.header}>
      {/* Left: Logo + Title */}
      <Group gap="sm" className={classes.logo} onClick={() => navigate('/dashboard')}>
        <div className={classes.logoWrapper}>
          <IconBrain size={22} stroke={2} />
        </div>
        <Text size="xl" fw={700} className={classes.logoText}>
          unified-ui
        </Text>
      </Group>

      {/* Center: Search Bar */}
      <TextInput
        className={classes.search}
        placeholder="Search..."
        leftSection={<IconSearch size={16} />}
        radius="xl"
      />

      {/* Right: Theme Toggle + Notifications + User */}
      <Group gap="md">
        <ActionIcon 
          variant="subtle" 
          size="lg" 
          radius="xl"
          onClick={() => toggleColorScheme()}
          title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
          {isDark ? <IconSun size={20} /> : <IconMoon size={20} />}
        </ActionIcon>

        <Indicator inline label="2" size={16} color="red">
          <ActionIcon variant="subtle" size="lg" radius="xl">
            <IconBell size={20} />
          </ActionIcon>
        </Indicator>
        
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
                {/* User Info */}
                <Stack gap={4}>
                  <Text size="sm" fw={700}>{userName}</Text>
                  <Text size="xs" c="dimmed">{userEmail}</Text>
                </Stack>

                <Divider />

                {/* Tenant Selection */}
                <Stack gap="xs">
                  <Text size="xs" fw={700}>Tenant:</Text>
                  <Select
                    data={tenantOptions}
                    value={selectedTenant?.id || null}
                    onChange={handleTenantChange}
                    searchable
                    size="xs"
                    placeholder="Tenant auswählen"
                    disabled={tenants.length === 0}
                  />
                </Stack>

                {/* Tenant Info */}
                {selectedTenant && (
                  <Stack gap={4}>
                    <Text size="xs" fw={700}>Tenant ID:</Text>
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
                  Add Tenant
                </Button>

                <Divider />

                {/* Management Links */}
                <Stack gap="xs">
                  <UnstyledButton className={classes.menuLink}>
                    <Group gap="xs" justify="space-between">
                      <Text size="sm">Manage Account</Text>
                      <IconExternalLink size={16} />
                    </Group>
                  </UnstyledButton>
                  <UnstyledButton className={classes.menuLink}>
                    <Group gap="xs" justify="space-between">
                      <Text size="sm">Manage Tenant</Text>
                      <IconExternalLink size={16} />
                    </Group>
                  </UnstyledButton>
                  <UnstyledButton className={classes.menuLink}>
                    <Group gap="xs" justify="space-between">
                      <Text size="sm">Manage Licence</Text>
                      <IconExternalLink size={16} />
                    </Group>
                  </UnstyledButton>
                </Stack>

                <Divider />

                {/* Logout Button */}
                <Button 
                  leftSection={<IconLogout size={16} />}
                  variant="light" 
                  color="red"
                  fullWidth
                  onClick={logout}
                >
                  Logout
                </Button>
              </Stack>
            </Paper>
          )}
        </div>
      </Group>

      {/* Create Tenant Dialog */}
      <CreateTenantDialog
        opened={isTenantDialogOpen}
        onClose={() => setIsTenantDialogOpen(false)}
      />
    </header>
  );
};
