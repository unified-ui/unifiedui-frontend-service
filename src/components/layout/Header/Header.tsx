import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Group, TextInput, Indicator, ActionIcon, Avatar, Text, useMantineColorScheme, Stack, Paper, Button, Divider, Select, UnstyledButton } from '@mantine/core';
import { IconSearch, IconBell, IconSparkles, IconSun, IconMoon, IconLogout, IconExternalLink } from '@tabler/icons-react';
import { useAuth } from '../../../auth';
import classes from './Header.module.css';

export const Header: FC = () => {
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { account, logout } = useAuth();
  const isDark = colorScheme === 'dark';
  const [userDropdownOpened, setUserDropdownOpened] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState('TenantName');
  const userAccountRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userAccountRef.current && !userAccountRef.current.contains(event.target as Node)) {
        setUserDropdownOpened(false);
      }
    };

    if (userDropdownOpened) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpened]);

  const userName = account?.name || 'User';
  const userEmail = account?.username || 'user@example.com';
  const displayName = userName.length > 20 ? userName.substring(0, 20) + '…' : userName;

  const tenantOptions = [
    'TenantName',
    'Acme Corporation',
    'Tech Solutions Ltd',
    'Global Ventures Inc',
    'Innovation Labs',
    'Enterprise Systems'
  ];

  return (
    <header className={classes.header}>
      {/* Left: Logo + Title */}
      <Group gap="sm" className={classes.logo} onClick={() => navigate('/dashboard')}>
        <IconSparkles size={32} className={classes.logoIcon} />
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
              <Text size="xs" c="dimmed">TenantName</Text>
            </Stack>
          </Group>

          {userDropdownOpened && (
            <Paper className={classes.userDropdown} shadow="md" radius="md" p="md">
              <Stack gap="md">
                {/* User Info */}
                <Stack gap={4}>
                  <Text size="sm" fw={700}>{userName}</Text>
                  <Text size="xs" c="dimmed">{userEmail}</Text>
                </Stack>

                <Divider />

                {/* Tenant Selection */}
                <Stack gap="xs">
                  <Text size="xs" fw={700}>Tenant Name:</Text>
                  <Select
                    data={tenantOptions}
                    value={selectedTenant}
                    onChange={(value) => setSelectedTenant(value || 'TenantName')}
                    searchable
                    size="xs"
                  />
                </Stack>

                {/* License Info */}
                <Stack gap={4}>
                  <Text size="xs" fw={700}>License:</Text>
                  <Text size="xs" c="dimmed">Standard</Text>
                </Stack>

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
    </header>
  );
};
