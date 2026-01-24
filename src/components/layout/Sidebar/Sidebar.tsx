import { type FC, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Stack, UnstyledButton, Text, Tooltip, Divider } from '@mantine/core';
import { 
  IconHome, IconHomeFilled,
  IconRobot,
  IconMessages, IconMessageFilled,
  IconSparkles,
  IconSettings, IconSettingsFilled,
  IconBrandWechat,
  IconTool,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebarData, type EntityType } from '../../../contexts';
import { SidebarDataList, type DataListItem } from './SidebarDataList';
import { GlobalChatSidebar } from '../GlobalChatSidebar/GlobalChatSidebar';
import {
  CreateApplicationDialog,
  CreateAutonomousAgentDialog,
  CreateChatWidgetDialog,
} from '../../dialogs';
import classes from './Sidebar.module.css';

interface NavItem {
  icon: typeof IconHome;
  iconFilled?: typeof IconHomeFilled;
  label: string;
  path: string;
  hasDataList?: boolean;
  entityType?: EntityType;
}

const mainNavItemsTop: NavItem[] = [
  { icon: IconHome, iconFilled: IconHomeFilled, label: 'Home', path: '/dashboard' },
  { icon: IconMessages, iconFilled: IconMessageFilled, label: 'Conversations', path: '/conversations' },
  { icon: IconSparkles, label: 'Chat Agents', path: '/applications', hasDataList: true, entityType: 'applications' },
  { icon: IconRobot, label: 'Autonomous\nAgents', path: '/autonomous-agents', hasDataList: true, entityType: 'autonomous-agents' },
];

const mainNavItemsBottom: NavItem[] = [
  { icon: IconTool, label: 'ReACT-Agent\nDevelopment', path: '/tenant-settings?tab=tools' },
  { icon: IconBrandWechat, label: 'Chat\nWidgets', path: '/chat-widgets', hasDataList: true, entityType: 'chat-widgets' },
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
    chatWidgets,
    loadingStates,
    errorStates,
    fetchEntityData,
    refreshEntityData,
    refreshApplications,
    refreshAutonomousAgents,
    refreshChatWidgets,
  } = useSidebarData();
  
  // State for data list panel
  const [activeEntity, setActiveEntity] = useState<EntityType | null>(null);
  const [isDataListExpanded, setIsDataListExpanded] = useState(false);
  const [isHoveringDataList, setIsHoveringDataList] = useState(false);
  const [isHoveringNavItem, setIsHoveringNavItem] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // State for Conversations sidebar (same pattern as other data lists)
  const [isConversationsSidebarVisible, setIsConversationsSidebarVisible] = useState(false);
  const [isHoveringConversationsNav, setIsHoveringConversationsNav] = useState(false);
  const [isHoveringConversationsSidebar, setIsHoveringConversationsSidebar] = useState(false);
  
  // Timeout refs for hover delay
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Timeout refs for Conversations sidebar
  const conversationsHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationsCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Dialog states
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isAutonomousAgentDialogOpen, setIsAutonomousAgentDialogOpen] = useState(false);
  const [isChatWidgetDialogOpen, setIsChatWidgetDialogOpen] = useState(false);

  // Entity configurations
  const entityConfigs: Record<EntityType, EntityConfig> = useMemo(() => ({
    applications: {
      title: 'Chat Agents',
      icon: <IconSparkles size={24} />,
      addButtonLabel: 'Add Chat Agent',
      fetchData: () => fetchEntityData('applications'),
      getLink: (id) => `/conversations?chat-agent=${id}`,
    },
    'autonomous-agents': {
      title: 'Autonomous Agents',
      icon: <IconRobot size={24} />,
      addButtonLabel: 'Add Autonomous Agent',
      fetchData: () => fetchEntityData('autonomous-agents'),
      getLink: (id) => `/autonomous-agents/${id}`,
    },
    'chat-widgets': {
      title: 'Chat Widgets',
      icon: <IconBrandWechat size={24} />,
      addButtonLabel: 'Add Chat Widget',
      fetchData: () => fetchEntityData('chat-widgets'),
      getLink: (id) => `/chat-widgets/${id}`,
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
      case 'chat-widgets':
        return chatWidgets.map(widget => ({
          id: widget.id,
          name: widget.name,
          link: entityConfigs['chat-widgets'].getLink(widget.id),
          icon: <IconBrandWechat size={16} />,
        }));
      default:
        return [];
    }
  }, [activeEntity, applications, autonomousAgents, chatWidgets, entityConfigs]);

  // Check if user is on the entity's list page (not detail page)
  const isOnEntityListPage = useCallback((entityType: EntityType) => {
    const entityPaths: Record<EntityType, string> = {
      applications: '/applications',
      'autonomous-agents': '/autonomous-agents',
      'chat-widgets': '/chat-widgets',
    };
    // Only return true if exactly on the list page, not on detail pages
    return location.pathname === entityPaths[entityType];
  }, [location.pathname]);

  // Handle nav item hover enter
  const handleNavItemHoverEnter = useCallback((item: NavItem) => {
    if (!item.hasDataList || !item.entityType) return;
    if (isOnEntityListPage(item.entityType)) return; // Don't show if already on list page
    
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
      if (config) {
        config.fetchData();
      }
    }, 150);
  }, [entityConfigs, isOnEntityListPage]);

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

  // ========== Conversations Sidebar Hover Handlers (same pattern as above) ==========
  
  // Check if on conversations page
  const isOnConversationsPage = location.pathname.startsWith('/conversations');
  
  // Handle Conversations nav item hover enter
  const handleConversationsNavHoverEnter = useCallback(() => {
    // Don't show if already on conversations page
    if (isOnConversationsPage) return;
    
    // Clear any pending close timeout
    if (conversationsCloseTimeoutRef.current) {
      clearTimeout(conversationsCloseTimeoutRef.current);
      conversationsCloseTimeoutRef.current = null;
    }
    
    // Set hover state immediately
    setIsHoveringConversationsNav(true);
    
    // Small delay before showing sidebar
    if (conversationsHoverTimeoutRef.current) {
      clearTimeout(conversationsHoverTimeoutRef.current);
    }
    
    conversationsHoverTimeoutRef.current = setTimeout(() => {
      setIsConversationsSidebarVisible(true);
    }, 150);
  }, [isOnConversationsPage]);

  // Handle Conversations nav item hover leave
  const handleConversationsNavHoverLeave = useCallback(() => {
    setIsHoveringConversationsNav(false);
    
    if (conversationsHoverTimeoutRef.current) {
      clearTimeout(conversationsHoverTimeoutRef.current);
      conversationsHoverTimeoutRef.current = null;
    }
    
    // Delay closing to allow moving to sidebar
    conversationsCloseTimeoutRef.current = setTimeout(() => {
      if (!isHoveringConversationsSidebar) {
        setIsConversationsSidebarVisible(false);
      }
    }, 200);
  }, [isHoveringConversationsSidebar]);

  // Handle Conversations sidebar hover enter
  const handleConversationsSidebarHoverEnter = useCallback(() => {
    setIsHoveringConversationsSidebar(true);
    
    if (conversationsCloseTimeoutRef.current) {
      clearTimeout(conversationsCloseTimeoutRef.current);
      conversationsCloseTimeoutRef.current = null;
    }
  }, []);

  // Handle Conversations sidebar hover leave
  const handleConversationsSidebarHoverLeave = useCallback(() => {
    setIsHoveringConversationsSidebar(false);
    
    conversationsCloseTimeoutRef.current = setTimeout(() => {
      if (!isHoveringConversationsNav) {
        setIsConversationsSidebarVisible(false);
      }
    }, 200);
  }, [isHoveringConversationsNav]);

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
      case 'chat-widgets':
        setIsChatWidgetDialogOpen(true);
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

  const handleChatWidgetCreated = useCallback(() => {
    refreshChatWidgets();
  }, [refreshChatWidgets]);

  // Handle refresh button click (bypasses cache)
  const handleRefresh = useCallback(async () => {
    if (!activeEntity) return;
    
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
      if (conversationsHoverTimeoutRef.current) clearTimeout(conversationsHoverTimeoutRef.current);
      if (conversationsCloseTimeoutRef.current) clearTimeout(conversationsCloseTimeoutRef.current);
    };
  }, []);

  // Close data list when navigating
  useEffect(() => {
    handleCloseDataList();
  }, [location.pathname, handleCloseDataList]);

  const renderNavItem = (item: NavItem) => {
    const Icon = item.icon;
    const IconFilled = item.iconFilled || item.icon;
    const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
    const isEntityHovered = item.entityType === activeEntity;
    const isConversationsItem = item.path === '/conversations';

    const handleMouseEnter = () => {
      // Trigger conversations sidebar hover for Conversations item
      if (isConversationsItem) {
        handleConversationsNavHoverEnter();
      }
      // Trigger data list hover for items with data lists
      handleNavItemHoverEnter(item);
    };

    const handleMouseLeave = () => {
      // Trigger conversations sidebar hover leave for Conversations item
      if (isConversationsItem) {
        handleConversationsNavHoverLeave();
      }
      handleNavItemHoverLeave();
    };

    return (
      <Tooltip key={item.path} label={item.label} position="right" withArrow>
        <UnstyledButton
          onClick={() => navigate(item.path)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
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
          onAdd={handleAddClick}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />
      )}

      {/* Conversations Sidebar (same pattern as Data List Panel) */}
      <GlobalChatSidebar
        isVisible={isConversationsSidebarVisible}
        onMouseEnter={handleConversationsSidebarHoverEnter}
        onMouseLeave={handleConversationsSidebarHoverLeave}
      />

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
      <CreateChatWidgetDialog
        opened={isChatWidgetDialogOpen}
        onClose={() => setIsChatWidgetDialogOpen(false)}
        onSuccess={handleChatWidgetCreated}
      />
    </>
  );
};
