import type { FC, ReactNode } from 'react';
import { useMemo } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Divider, Group, Text, ThemeIcon } from '@mantine/core';
import {
  IconChartBar,
  IconLayoutDashboard,
  IconUsers,
  IconUsersGroup,
  IconKey,
  IconCpu,
  IconSettings,
  IconBuilding,
  IconReceipt,
  IconApi,
  IconExternalLink,
} from '@tabler/icons-react';
import { MainLayout } from '../MainLayout';
import { usePermissions } from '../../../hooks';
import classes from './AdminLayout.module.css';

interface ExternalLinkEntry {
  href: string;
  label: string;
  icon: typeof IconApi;
}

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

const PLATFORM_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const AGENT_BASE_URL = import.meta.env.VITE_AGENT_SERVICE_URL || 'http://localhost:8085';

const DEVELOPER_ITEMS: ExternalLinkEntry[] = [
  { href: `${PLATFORM_BASE_URL}/docs`, label: 'Platform API Docs', icon: IconApi },
  { href: `${AGENT_BASE_URL}/docs/index.html`, label: 'Agent API Docs', icon: IconApi },
];

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

const ORG_ONLY_TABS = new Set(['org-iam', 'organization']);

export const AdminLayout: FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { pathname, search } = location;
  const { hasOrgBypass } = usePermissions();

  const filteredSettingsItems = useMemo(() => {
    if (hasOrgBypass) return SETTINGS_ITEMS;
    return SETTINGS_ITEMS.filter(item => {
      const params = new URLSearchParams(item.to.split('?')[1] || '');
      const tab = params.get('tab') ?? '';
      return !ORG_ONLY_TABS.has(tab);
    });
  }, [hasOrgBypass]);

  return (
    <MainLayout>
      <Group align="flex-start" gap={0} className={classes.root}>
        <div className={classes.sidebar}>
          <Group gap="xs" mb="md" px="sm" className={classes.sidebarHeader}>
            <ThemeIcon variant="light" color="blue" size="lg">
              <IconChartBar size={18} />
            </ThemeIcon>
            <Text fw={600}>Admin</Text>
          </Group>
          <ul className={classes.sidebarNav}>
            {NAV_ITEMS.map((item) => renderNavLink(item, pathname, search))}
            <Divider my="xs" label="Settings" labelPosition="left" />
            {filteredSettingsItems.map((item) => renderNavLink(item, pathname, search))}
            <Divider my="xs" label="Developer" labelPosition="left" />
            {DEVELOPER_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={classes.link}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
                <IconExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />
              </a>
            ))}
          </ul>
        </div>
        <div className={classes.content}>{children}</div>
      </Group>
    </MainLayout>
  );
};
