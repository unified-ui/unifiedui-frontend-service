import type { FC } from 'react';
import { useState, useRef, useEffect } from 'react';
import { Group, TextInput, Indicator, ActionIcon, Avatar, Text, useMantineColorScheme, Stack, Paper, Button } from '@mantine/core';
import { IconSearch, IconBell, IconSparkles, IconSun, IconMoon, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../../../auth';
import classes from './Header.module.css';

export const Header: FC = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { account, logout } = useAuth();
  const isDark = colorScheme === 'dark';
  const [userDropdownOpened, setUserDropdownOpened] = useState(false);
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
  const displayName = userName.length > 20 ? userName.substring(0, 20) + '…' : userName;

  return (
    <header className={classes.header}>
      {/* Left: Logo + Title */}
      <Group gap="sm" className={classes.logo}>
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
              <Stack gap="sm">
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
