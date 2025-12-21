import type { FC } from 'react';
import { Stack, UnstyledButton, Text, Tooltip } from '@mantine/core';
import { 
  IconHome, IconHomeFilled,
  IconRobot,
  IconMessages, IconMessageFilled,
  IconKey, IconKeyFilled,
  IconCode,
  IconSettings, IconSettingsFilled 
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import classes from './Sidebar.module.css';

interface NavItem {
  icon: typeof IconHome;
  iconFilled?: typeof IconHomeFilled;
  label: string;
  path: string;
}

const mainNavItems: NavItem[] = [
  { icon: IconHome, iconFilled: IconHomeFilled, label: 'Home', path: '/dashboard' },
  { icon: IconRobot, label: 'Applications', path: '/applications' },
  { icon: IconMessages, iconFilled: IconMessageFilled, label: 'Conversations', path: '/conversations' },
  { icon: IconKey, iconFilled: IconKeyFilled, label: 'Credentials', path: '/credentials' },
  { icon: IconCode, label: 'Development', path: '/development' },
];

const bottomNavItems: NavItem[] = [
  { icon: IconSettings, iconFilled: IconSettingsFilled, label: 'Settings', path: '/tenant-settings' },
];

export const Sidebar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const IconFilled = item.iconFilled || item.icon;
    const isActive = location.pathname === item.path;

    return (
      <Tooltip key={item.path} label={item.label} position="right" withArrow>
        <UnstyledButton
          onClick={() => navigate(item.path)}
          className={`${classes.navItem} ${isActive ? classes.navItemActive : ''}`}
        >
          {isActive ? <IconFilled size={24} stroke={isActive && item.iconFilled ? 0 : 1.5} /> : <Icon size={24} stroke={1.5} />}
          <Text 
            size="xs" 
            className={classes.navLabel}
            fw={isActive ? 700 : 400}
          >
            {item.label}
          </Text>
        </UnstyledButton>
      </Tooltip>
    );
  };

  return (
    <aside className={classes.sidebar}>
      <Stack gap="xs" className={classes.navMain}>
        {mainNavItems.map(renderNavItem)}
      </Stack>
      
      <Stack gap="xs" className={classes.navBottom}>
        {bottomNavItems.map(renderNavItem)}
      </Stack>
    </aside>
  );
};
