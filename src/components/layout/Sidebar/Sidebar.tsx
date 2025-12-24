import { type FC, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Stack, UnstyledButton, Text, Tooltip, Divider } from '@mantine/core';
import { 
  IconHome, IconHomeFilled,
  IconRobot,
  IconMessages, IconMessageFilled,
  IconSparkles,
  IconKey, IconKeyFilled,
  IconCode,
  IconSettings, IconSettingsFilled 
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebarData, type EntityType } from '../../../contexts';
import { SidebarDataList, type DataListItem } from './SidebarDataList';
import {
  CreateApplicationDialog,
  CreateAutonomousAgentDialog,
  CreateCredentialDialog,
} from '../../dialogs';
import classes from './Sidebar.module.css';

interface NavItem {
  icon: typeof IconHome;
  iconFilled?: typeof IconHomeFilled;
  label: string;
  path: string;
  hasDataList?: boolean;
  entityType?: 'applications' | 'autonomous-agents' | 'credentials' | 'development';
}

const mainNavItemsTop: NavItem[] = [
  { icon: IconHome, iconFilled: IconHomeFilled, label: 'Home', path: '/dashboard' },
  { icon: IconMessages, iconFilled: IconMessageFilled, label: 'Conversations', path: '/conversations' },
  { icon: IconSparkles, label: 'Chat Agents', path: '/applications', hasDataList: true, entityType: 'applications' },
  { icon: IconRobot, label: 'Autonomous\nAgents', path: '/autonomous-agents', hasDataList: true, entityType: 'autonomous-agents' },
  { icon: IconKey, iconFilled: IconKeyFilled, label: 'Credentials', path: '/credentials', hasDataList: true, entityType: 'credentials' },
];

const mainNavItemsBottom: NavItem[] = [
  { icon: IconCode, label: 'Development', path: '/development', hasDataList: true, entityType: 'development' },
];

const bottomNavItems: NavItem[] = [
  { icon: IconSettings, iconFilled: IconSettingsFilled, label: 'Settings', path: '/tenant-settings' },
];

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
  
  // Use global sidebar data context
  const {
    applications,
    autonomousAgents,
    credentials,
    loadingStates,
    errorStates,
    fetchEntityData,
    refreshEntityData,
    refreshApplications,
    refreshAutonomousAgents,
    refreshCredentials,
  } = useSidebarData();
  
  // State for data list panel
  const [activeEntity, setActiveEntity] = useState<EntityType | null>(null);
  const [isDataListExpanded, setIsDataListExpanded] = useState(false);
  const [isHoveringDataList, setIsHoveringDataList] = useState(false);
  const [isHoveringNavItem, setIsHoveringNavItem] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Timeout refs for hover delay
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog states
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isAutonomousAgentDialogOpen, setIsAutonomousAgentDialogOpen] = useState(false);
  const [isCredentialDialogOpen, setIsCredentialDialogOpen] = useState(false);

  // Entity configurations
  const entityConfigs: Record<EntityType, EntityConfig> = useMemo(() => ({
    applications: {
      title: 'Chat Agents',
      icon: <IconSparkles size={24} />,
      addButtonLabel: 'Add Chat Agent',
      fetchData: () => fetchEntityData('applications'),
      getLink: (id) => `/applications/${id}`,
    },
    'autonomous-agents': {
      title: 'Autonomous Agents',
      icon: <IconRobot size={24} />,
      addButtonLabel: 'Add Autonomous Agent',
      fetchData: () => fetchEntityData('autonomous-agents'),
      getLink: (id) => `/autonomous-agents/${id}`,
    },
    credentials: {
      title: 'Credentials',
      icon: <IconKey size={24} />,
      addButtonLabel: 'Add Credential',
      fetchData: () => fetchEntityData('credentials'),
      getLink: (id) => `/credentials/${id}`,
    },
    development: {
      title: 'Development',
      icon: <IconCode size={24} />,
      addButtonLabel: 'Add Platform',
      fetchData: async () => {}, // No data to fetch
      getLink: () => '/development',
    },
  }), [fetchEntityData]);

  // Get data items for active entity
  const dataListItems: DataListItem[] = useMemo(() => {
    if (!activeEntity) return [];
    
    switch (activeEntity) {
      case 'applications':
        return applications.map(app => ({
          id: app.id,
          name: app.name,
          link: entityConfigs.applications.getLink(app.id),
          icon: <IconSparkles size={16} />,
        }));
      case 'autonomous-agents':
        return autonomousAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          link: entityConfigs['autonomous-agents'].getLink(agent.id),
          icon: <IconRobot size={16} />,
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

  // Handle successful creation - refresh the data list (using refresh to bypass cache)
  const handleApplicationCreated = useCallback(() => {
    refreshApplications();
  }, [refreshApplications]);

  const handleAutonomousAgentCreated = useCallback(() => {
    refreshAutonomousAgents();
  }, [refreshAutonomousAgents]);

  const handleCredentialCreated = useCallback(() => {
    refreshCredentials();
  }, [refreshCredentials]);

  // Handle refresh button click (bypasses cache)
  const handleRefresh = useCallback(async () => {
    if (!activeEntity || activeEntity === 'development') return;
    
    setIsRefreshing(true);
    try {
      await refreshEntityData(activeEntity);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeEntity, refreshEntityData]);

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
          {mainNavItemsTop.map(renderNavItem)}
          <Divider className={classes.navDivider} />
          {mainNavItemsBottom.map(renderNavItem)}
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
          onRefresh={activeEntity !== 'development' ? handleRefresh : undefined}
          isRefreshing={isRefreshing}
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
