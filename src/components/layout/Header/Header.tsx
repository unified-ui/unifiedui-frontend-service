import type { FC } from 'react';
import { Group, TextInput, Indicator, ActionIcon, Avatar, Text, useMantineColorScheme } from '@mantine/core';
import { IconSearch, IconBell, IconSparkles, IconSun, IconMoon } from '@tabler/icons-react';
import classes from './Header.module.css';

export const Header: FC = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === 'dark';

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
        
        <Group gap="xs" className={classes.userAccount}>
          <Avatar radius="xl" size="sm" color="primary" />
          <Text size="sm" fw={500}>User Account</Text>
        </Group>
      </Group>
    </header>
  );
};
