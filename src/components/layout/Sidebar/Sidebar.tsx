import { type FC, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Stack, UnstyledButton, Text, Tooltip } from '@mantine/core';
import { 
  IconHome, IconHomeFilled,
  IconRobot,
  IconMessages, IconMessageFilled,
  IconBrain,
  IconKey, IconKeyFilled,
  IconCode,
  IconSettings, IconSettingsFilled 
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIdentity } from '../../../contexts';
import { SidebarDataList, type DataListItem } from './SidebarDataList';
import {
  CreateApplicationDialog,
  CreateAutonomousAgentDialog,
  CreateCredentialDialog,
} from '../../dialogs';
import type { ApplicationResponse, AutonomousAgentResponse, CredentialResponse } from '../../../api/types';
import classes from './Sidebar.module.css';

interface NavItem {
  icon: typeof IconHome;
  iconFilled?: typeof IconHomeFilled;
  label: string;
  path: string;
  hasDataList?: boolean;
  entityType?: 'applications' | 'autonomous-agents' | 'credentials' | 'development';
}

const mainNavItems: NavItem[] = [
  { icon: IconHome, iconFilled: IconHomeFilled, label: 'Home', path: '/dashboard' },
  { icon: IconMessages, iconFilled: IconMessageFilled, label: 'Conversations', path: '/conversations' },
  { icon: IconRobot, label: 'Applications', path: '/applications', hasDataList: true, entityType: 'applications' },
  { icon: IconBrain, label: 'Autonomous\nAgents', path: '/autonomous-agents', hasDataList: true, entityType: 'autonomous-agents' },
  { icon: IconKey, iconFilled: IconKeyFilled, label: 'Credentials', path: '/credentials', hasDataList: true, entityType: 'credentials' },
  { icon: IconCode, label: 'Development', path: '/development', hasDataList: true, entityType: 'development' },
];

const bottomNavItems: NavItem[] = [
  { icon: IconSettings, iconFilled: IconSettingsFilled, label: 'Settings', path: '/tenant-settings' },
];

type EntityType = 'applications' | 'autonomous-agents' | 'credentials' | 'development';

interface EntityConfig {
  title: string;
  icon: React.ReactNode;
  addButtonLabel: string;
  fetchData: () => Promise<void>;
  getLink: (id: string) => string;
}

export const Sidebar: FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { apiClient, selectedTenant } = useIdentity();
  
  // State for data list panel
  const [activeEntity, setActiveEntity] = useState<EntityType | null>(null);
  const [isDataListExpanded, setIsDataListExpanded] = useState(false);
  const [isHoveringDataList, setIsHoveringDataList] = useState(false);
  const [isHoveringNavItem, setIsHoveringNavItem] = useState(false);
  
  // Data cache state
  const [applications, setApplications] = useState<ApplicationResponse[]>([]);
  const [autonomousAgents, setAutonomousAgents] = useState<AutonomousAgentResponse[]>([]);
  const [credentials, setCredentials] = useState<CredentialResponse[]>([]);
  
  // Loading states
  const [loadingStates, setLoadingStates] = useState<Record<EntityType, boolean>>({
    applications: false,
    'autonomous-agents': false,
    credentials: false,
    development: false,
  });
  
  // Error states
  const [errorStates, setErrorStates] = useState<Record<EntityType, string | null>>({
    applications: null,
    'autonomous-agents': null,
    credentials: null,
    development: null,
  });
  
  // Timeout refs for hover delay
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog states
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isAutonomousAgentDialogOpen, setIsAutonomousAgentDialogOpen] = useState(false);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);

  // Fetch data functions
  const fetchApplications = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;
    setLoadingStates(prev => ({ ...prev, applications: true }));
    setErrorStates(prev => ({ ...prev, applications: null }));
    try {
      const data = await apiClient.listApplications(selectedTenant.id, { limit: 999 });
      setApplications(data);
    } catch (error) {
      setErrorStates(prev => ({ ...prev, applications: 'Fehler beim Laden der Applications' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, applications: false }));
    }
  }, [apiClient, selectedTenant]);

  const fetchAutonomousAgents = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;
    setLoadingStates(prev => ({ ...prev, 'autonomous-agents': true }));
    setErrorStates(prev => ({ ...prev, 'autonomous-agents': null }));
    try {
      const data = await apiClient.listAutonomousAgents(selectedTenant.id, { limit: 999 });
      setAutonomousAgents(data);
    } catch (error) {
      setErrorStates(prev => ({ ...prev, 'autonomous-agents': 'Fehler beim Laden der Autonomous Agents' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, 'autonomous-agents': false }));
    }
  }, [apiClient, selectedTenant]);

  const fetchCredentials = useCallback(async () => {
    if (!apiClient || !selectedTenant) return;
    setLoadingStates(prev => ({ ...prev, credentials: true }));
    setErrorStates(prev => ({ ...prev, credentials: null }));
    try {
      const data = await apiClient.listCredentials(selectedTenant.id, { limit: 999 });
      setCredentials(data);
    } catch (error) {
      setErrorStates(prev => ({ ...prev, credentials: 'Fehler beim Laden der Credentials' }));
    } finally {
      setLoadingStates(prev => ({ ...prev, credentials: false }));
    }
  }, [apiClient, selectedTenant]);

  // Entity configurations
  const entityConfigs: Record<EntityType, EntityConfig> = useMemo(() => ({
    applications: {
      title: 'Applications',
      icon: <IconRobot size={24} />,
      addButtonLabel: 'Add Application',
      fetchData: fetchApplications,
      getLink: (id) => `/applications/${id}`,
    },
    'autonomous-agents': {
      title: 'Autonomous Agents',
      icon: <IconBrain size={24} />,
      addButtonLabel: 'Add Autonomous Agent',
      fetchData: fetchAutonomousAgents,
      getLink: (id) => `/autonomous-agents/${id}`,
    },
    credentials: {
      title: 'Credentials',
      icon: <IconKey size={24} />,
      addButtonLabel: 'Add Credential',
      fetchData: fetchCredentials,
      getLink: (id) => `/credentials/${id}`,
    },
    development: {
      title: 'Development',
      icon: <IconCode size={24} />,
      addButtonLabel: 'Add Platform hinzufügen',
      fetchData: async () => {}, // No data to fetch
      getLink: () => '/development',
    },
  }), [fetchApplications, fetchAutonomousAgents, fetchCredentials]);

  // Get data items for active entity
  const dataListItems: DataListItem[] = useMemo(() => {
    if (!activeEntity) return [];
    
    switch (activeEntity) {
      case 'applications':
        return applications.map(app => ({
          id: app.id,
          name: app.name,
          link: entityConfigs.applications.getLink(app.id),
          icon: <IconRobot size={16} />,
        }));
      case 'autonomous-agents':
        return autonomousAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          link: entityConfigs['autonomous-agents'].getLink(agent.id),
          icon: <IconBrain size={16} />,
        }));
      case 'credentials':
        return credentials.map(cred => ({
          id: cred.id,
          name: cred.name,
          link: entityConfigs.credentials.getLink(cred.id),
          icon: <IconKey size={16} />,
        }));
      case 'development':
        return []; // Empty list for development
      default:
        return [];
    }
  }, [activeEntity, applications, autonomousAgents, credentials, entityConfigs]);

  // Check if user is on the entity's page
  const isOnEntityPage = useCallback((entityType: EntityType) => {
    const entityPaths: Record<EntityType, string> = {
      applications: '/applications',
      'autonomous-agents': '/autonomous-agents',
      credentials: '/credentials',
      development: '/development',
    };
    return location.pathname.startsWith(entityPaths[entityType]);
  }, [location.pathname]);

  // Handle nav item hover enter
  const handleNavItemHoverEnter = useCallback((item: NavItem) => {
    if (!item.hasDataList || !item.entityType) return;
    if (isOnEntityPage(item.entityType)) return; // Don't show if already on page
    
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    // Set hover state immediately
    setIsHoveringNavItem(true);
    
    // Small delay before showing data list
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveEntity(item.entityType!);
      
      // Fetch data if needed
      const config = entityConfigs[item.entityType!];
      if (config && item.entityType !== 'development') {
        config.fetchData();
      }
    }, 150);
  }, [entityConfigs, isOnEntityPage]);

  // Handle nav item hover leave
  const handleNavItemHoverLeave = useCallback(() => {
    setIsHoveringNavItem(false);
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Delay closing to allow moving to data list
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringDataList) {
        setActiveEntity(null);
        setIsDataListExpanded(false);
      }
    }, 200);
  }, [isHoveringDataList]);

  // Handle data list hover enter
  const handleDataListHoverEnter = useCallback(() => {
    setIsHoveringDataList(true);
    
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  // Handle data list hover leave
  const handleDataListHoverLeave = useCallback(() => {
    setIsHoveringDataList(false);
    
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringNavItem) {
        setActiveEntity(null);
        setIsDataListExpanded(false);
      }
    }, 200);
  }, [isHoveringNavItem]);

  // Handle close button click
  const handleCloseDataList = useCallback(() => {
    setActiveEntity(null);
    setIsDataListExpanded(false);
    setIsHoveringDataList(false);
  }, []);

  // Handle toggle expand
  const handleToggleExpand = useCallback(() => {
    setIsDataListExpanded(prev => !prev);
  }, []);

  // Handle add button click for each entity type
  const handleAddClick = useCallback(() => {
    if (!activeEntity) return;
    
    switch (activeEntity) {
      case 'applications':
        setIsApplicationDialogOpen(true);
        break;
      case 'autonomous-agents':
        setIsAutonomousAgentDialogOpen(true);
        break;
      case 'credentials':
        setIsCredentialDialogOpen(true);
        break;
      case 'development':
        // No dialog for development yet
        break;
    }
  }, [activeEntity]);

  // Handle successful creation - refresh the data list
  const handleApplicationCreated = useCallback(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleAutonomousAgentCreated = useCallback(() => {
    fetchAutonomousAgents();
  }, [fetchAutonomousAgents]);

  const handleCredentialCreated = useCallback(() => {
    fetchCredentials();
  }, [fetchCredentials]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  // Close data list when navigating
  useEffect(() => {
    handleCloseDataList();
  }, [location.pathname, handleCloseDataList]);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const IconFilled = item.iconFilled || item.icon;
    const isActive = location.pathname === item.path;
    const isEntityHovered = item.entityType === activeEntity;

    return (
      <Tooltip key={item.path} label={item.label} position="right" withArrow>
        <UnstyledButton
          onClick={() => navigate(item.path)}
          onMouseEnter={() => handleNavItemHoverEnter(item)}
          onMouseLeave={handleNavItemHoverLeave}
          className={`${classes.navItem} ${isActive ? classes.navItemActive : ''} ${isEntityHovered ? classes.navItemHovered : ''}`}
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

  // Get active entity config
  const activeConfig = activeEntity ? entityConfigs[activeEntity] : null;

  // Check if add button should be enabled for current entity
  const isAddEnabled = activeEntity !== 'development';

  return (
    <>
      <aside className={classes.sidebar}>
        <Stack gap="xs" className={classes.navMain}>
          {mainNavItems.map(renderNavItem)}
        </Stack>
        
        <Stack gap="xs" className={classes.navBottom}>
          {bottomNavItems.map(renderNavItem)}
        </Stack>
      </aside>
      
      {/* Data List Panel */}
      {activeEntity && activeConfig && (
        <SidebarDataList
          title={activeConfig.title}
          icon={activeConfig.icon}
          items={dataListItems}
          isLoading={loadingStates[activeEntity]}
          error={errorStates[activeEntity]}
          onClose={handleCloseDataList}
          isExpanded={isDataListExpanded}
          onToggleExpand={handleToggleExpand}
          onMouseEnter={handleDataListHoverEnter}
          onMouseLeave={handleDataListHoverLeave}
          addButtonLabel={activeConfig.addButtonLabel}
          onAdd={isAddEnabled ? handleAddClick : undefined}
        />
      )}

      {/* Create Dialogs */}
      <CreateApplicationDialog
        opened={isApplicationDialogOpen}
        onClose={() => setIsApplicationDialogOpen(false)}
        onSuccess={handleApplicationCreated}
      />
      <CreateAutonomousAgentDialog
        opened={isAutonomousAgentDialogOpen}
        onClose={() => setIsAutonomousAgentDialogOpen(false)}
        onSuccess={handleAutonomousAgentCreated}
      />
      <CreateCredentialDialog
        opened={isCredentialDialogOpen}
        onClose={() => setIsCredentialDialogOpen(false)}
        onSuccess={handleCredentialCreated}
      />
    </>
  );
};
