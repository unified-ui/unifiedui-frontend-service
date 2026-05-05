import type { FC, ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Divider, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import {
  IconChartBar,
  IconLayoutDashboard,
  IconUsers,
  IconUsersGroup,
  IconKey,
  IconTool,
  IconCpu,
  IconSettings,
  IconBuilding,
  IconReceipt,
} from '@tabler/icons-react';
import { MainLayout } from '../MainLayout';
import classes from './AdminLayout.module.css';

interface AdminLayoutProps {
  children: ReactNode;
}

interface NavEntry {
  to: string;
  label: string;
  icon: typeof IconLayoutDashboard;
  end?: boolean;
  match?: (pathname: string, search: string) => boolean;
}

const NAV_ITEMS: NavEntry[] = [
  { to: '/admin', label: 'Analytics', icon: IconChartBar, end: true },
];

const settingsTabMatch = (tab: string) => (pathname: string, search: string): boolean => {
  if (!pathname.startsWith('/admin/settings')) return false;
  const params = new URLSearchParams(search);
  const current = params.get('tab') ?? 'settings';
  return current === tab;
};

const SETTINGS_ITEMS: NavEntry[] = [
  { to: '/admin/settings?tab=iam', label: 'IAM', icon: IconUsers, match: settingsTabMatch('iam') },
  { to: '/admin/settings?tab=custom-groups', label: 'Custom Groups', icon: IconUsersGroup, match: settingsTabMatch('custom-groups') },
  { to: '/admin/settings?tab=credentials', label: 'Credentials', icon: IconKey, match: settingsTabMatch('credentials') },
  { to: '/admin/settings?tab=tools', label: 'Tools', icon: IconTool, match: settingsTabMatch('tools') },
  { to: '/admin/settings?tab=ai-models', label: 'AI Models', icon: IconCpu, match: settingsTabMatch('ai-models') },
  { to: '/admin/settings?tab=settings', label: 'Tenant Settings', icon: IconSettings, match: settingsTabMatch('settings') },
  { to: '/admin/settings?tab=organization', label: 'Organization Settings', icon: IconBuilding, match: settingsTabMatch('organization') },
  { to: '/admin/settings?tab=org-iam', label: 'Organization IAM', icon: IconUsers, match: settingsTabMatch('org-iam') },
  { to: '/admin/settings?tab=billing-and-licence', label: 'Billing & Licence', icon: IconReceipt, match: settingsTabMatch('billing-and-licence') },
];

const renderNavLink = (item: NavEntry, pathname: string, search: string): ReactNode => {
  const Icon = item.icon;
  const active = item.match
    ? item.match(pathname, search)
    : item.end
      ? pathname === item.to
      : pathname.startsWith(item.to);
  return (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={`${classes.link} ${active ? classes.linkActive : ''}`}
    >
      <Icon size={16} />
      <span>{item.label}</span>
    </NavLink>
  );
};

export const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { pathname, search } = location;
  return (
    <MainLayout>
      <Group align="flex-start" gap={0} className={classes.root}>
        <Stack gap="xs" className={classes.sidebar}>
          <Group gap="xs" mb="md" px="sm">
            <ThemeIcon variant="light" color="blue" size="lg">
              <IconChartBar size={18} />
            </ThemeIcon>
            <Text fw={600}>Admin</Text>
          </Group>
          {NAV_ITEMS.map((item) => renderNavLink(item, pathname, search))}
          <Divider my="xs" label="Settings" labelPosition="left" />
          {SETTINGS_ITEMS.map((item) => renderNavLink(item, pathname, search))}
        </Stack>
        <div className={classes.content}>{children}</div>
      </Group>
    </MainLayout>
  );
};
