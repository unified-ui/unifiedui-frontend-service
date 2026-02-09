import { type FC, useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Stack, UnstyledButton, Text, Tooltip, Divider } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { 
  IconHome, IconHomeFilled,
  IconMessages, IconMessageFilled,
  IconSparkles,
  IconSettings, IconSettingsFilled,
  IconBrandWechat,
  IconRobot,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebarData, useIdentity, useFavorites, type EntityType } from '../../../contexts';
import { EntityAvatar } from '../../common';
import { SidebarDataList, type DataListItem } from './SidebarDataList';
import {
  CreateApplicationDialog,
  CreateAutonomousAgentDialog,
  CreateChatWidgetDialog,
} from '../../dialogs';
import type { ConversationResponse, ApplicationResponse } from '../../../api/types';
import { FavoriteResourceTypeEnum } from '../../../api/types';
import classes from './Sidebar.module.css';

interface NavItem {
  icon: typeof IconHome;
  iconFilled?: typeof IconHomeFilled;
  labelKey: string;
  path: string;
  hasDataList?: boolean;
  entityType?: EntityType;
}

const mainNavItemsTop: NavItem[] = [
  { icon: IconHome, iconFilled: IconHomeFilled, labelKey: 'home', path: '/dashboard' },
  { icon: IconMessages, iconFilled: IconMessageFilled, labelKey: 'chats', path: '/conversations' },
  { icon: IconSparkles, labelKey: 'agents', path: '/applications', hasDataList: true, entityType: 'applications' },
  { icon: IconRobot, labelKey: 'auto', path: '/autonomous-agents', hasDataList: true, entityType: 'autonomous-agents' },
];

const mainNavItemsBottom: NavItem[] = [
  { icon: IconBrandWechat, labelKey: 'widgets', path: '/chat-widgets', hasDataList: true, entityType: 'chat-widgets' },
];

const bottomNavItems: NavItem[] = [
  { icon: IconSettings, iconFilled: IconSettingsFilled, labelKey: 'settings', path: '/tenant-settings' },
];

interface EntityConfig {
  title: string;
  icon: React.ReactNode;
  addButtonLabel: string;
  fetchData: () => Promise<void>;
  getLink: (id: string) => string;
}

const SIDEBAR_EXPAND_KEY = 'unified-ui-sidebar-expanded';

export const Sidebar: FC = () => {
  const { t } = useTranslation('sidebar');
  const navigate = useNavigate();
  const location = useLocation();
  
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
  
  const { apiClient, selectedTenant } = useIdentity();

  const { isFavorite: checkFavorite } = useFavorites();

  const ENTITY_TO_FAVORITE_TYPE: Record<string, FavoriteResourceTypeEnum> = useMemo(() => ({
    applications: FavoriteResourceTypeEnum.APPLICATION,
    'autonomous-agents': FavoriteResourceTypeEnum.AUTONOMOUS_AGENT,
    conversations: FavoriteResourceTypeEnum.CONVERSATION,
  }), []);

  const getIsFavoriteForEntity = useCallback(
    (entityType: EntityType | 'conversations') => {
      const favType = ENTITY_TO_FAVORITE_TYPE[entityType];
      if (!favType) return undefined;
      return (id: string) => checkFavorite(favType, id);
    },
    [checkFavorite, ENTITY_TO_FAVORITE_TYPE]
  );
  
  const [activeEntity, setActiveEntity] = useState<EntityType | null>(null);
  const [isDataListExpanded, setIsDataListExpanded] = useState(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_EXPAND_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });
  const [isHoveringDataList, setIsHoveringDataList] = useState(false);
  const [isHoveringNavItem, setIsHoveringNavItem] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [isConversationsSidebarVisible, setIsConversationsSidebarVisible] = useState(false);
  const [isHoveringConversationsNav, setIsHoveringConversationsNav] = useState(false);
  const [isHoveringConversationsSidebar, setIsHoveringConversationsSidebar] = useState(false);
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [conversationApplications, setConversationApplications] = useState<ApplicationResponse[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [conversationsError, setConversationsError] = useState<string | null>(null);
  const [conversationsRefreshing, setConversationsRefreshing] = useState(false);
  
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const conversationsHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const conversationsCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [isAutonomousAgentDialogOpen, setIsAutonomousAgentDialogOpen] = useState(false);
  const [isChatWidgetDialogOpen, setIsChatWidgetDialogOpen] = useState(false);

  const entityConfigs: Record<EntityType, EntityConfig> = useMemo(() => ({
    applications: {
      title: t('chatAgents'),
      icon: <IconSparkles size={24} />,
      addButtonLabel: t('addChatAgent'),
      fetchData: () => fetchEntityData('applications'),
      getLink: (id) => `/conversations?chat-agent=${id}`,
    },
    'autonomous-agents': {
      title: t('autonomousAgents'),
      icon: <IconRobot size={24} />,
      addButtonLabel: t('addAutonomousAgent'),
      fetchData: () => fetchEntityData('autonomous-agents'),
      getLink: (id) => `/autonomous-agents/${id}`,
    },
    'chat-widgets': {
      title: t('chatWidgets'),
      icon: <IconBrandWechat size={24} />,
      addButtonLabel: t('addChatWidget'),
      fetchData: () => fetchEntityData('chat-widgets'),
      getLink: (id) => `/chat-widgets/${id}`,
    },
  }), [fetchEntityData, t]);

  const dataListItems: DataListItem[] = useMemo(() => {
    if (!activeEntity) return [];
    
    switch (activeEntity) {
      case 'applications':
        return applications.map(app => ({
          id: app.id,
          name: app.name,
          link: entityConfigs.applications.getLink(app.id),
          icon: <EntityAvatar name={app.name} size="xs" />,
        }));
      case 'autonomous-agents':
        return autonomousAgents.map(agent => ({
          id: agent.id,
          name: agent.name,
          link: entityConfigs['autonomous-agents'].getLink(agent.id),
          icon: <EntityAvatar name={agent.name} size="xs" />,
        }));
      case 'chat-widgets':
        return chatWidgets.map(widget => ({
          id: widget.id,
          name: widget.name,
          link: entityConfigs['chat-widgets'].getLink(widget.id),
          icon: <EntityAvatar name={widget.name} size="xs" />,
        }));
      default:
        return [];
    }
  }, [activeEntity, applications, autonomousAgents, chatWidgets, entityConfigs]);

  const isOnEntityListPage = useCallback((entityType: EntityType) => {
    const entityPaths: Record<EntityType, string> = {
      applications: '/applications',
      'autonomous-agents': '/autonomous-agents',
      'chat-widgets': '/chat-widgets',
    };
    return location.pathname === entityPaths[entityType];
  }, [location.pathname]);

  const handleNavItemHoverEnter = useCallback((item: NavItem) => {
    if (!item.hasDataList || !item.entityType) return;
    if (isOnEntityListPage(item.entityType)) return;
    
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    setIsHoveringNavItem(true);
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveEntity(item.entityType!);
      
      const config = entityConfigs[item.entityType!];
      if (config) {
        config.fetchData();
      }
    }, 150);
  }, [entityConfigs, isOnEntityListPage]);

  const handleNavItemHoverLeave = useCallback(() => {
    setIsHoveringNavItem(false);
    
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringDataList) {
        setActiveEntity(null);
      }
    }, 200);
  }, [isHoveringDataList]);

  const handleDataListHoverEnter = useCallback(() => {
    setIsHoveringDataList(true);
    
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const handleDataListHoverLeave = useCallback(() => {
    setIsHoveringDataList(false);
    
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringNavItem) {
        setActiveEntity(null);
      }
    }, 200);
  }, [isHoveringNavItem]);

  const isOnConversationsPage = location.pathname.startsWith('/conversations');
  
  const handleConversationsNavHoverEnter = useCallback(() => {
    if (isOnConversationsPage) return;
    
    if (conversationsCloseTimeoutRef.current) {
      clearTimeout(conversationsCloseTimeoutRef.current);
      conversationsCloseTimeoutRef.current = null;
    }
    
    setIsHoveringConversationsNav(true);
    
    if (conversationsHoverTimeoutRef.current) {
      clearTimeout(conversationsHoverTimeoutRef.current);
    }
    
    conversationsHoverTimeoutRef.current = setTimeout(() => {
      setIsConversationsSidebarVisible(true);
    }, 150);
  }, [isOnConversationsPage]);

  const handleConversationsNavHoverLeave = useCallback(() => {
    setIsHoveringConversationsNav(false);
    
    if (conversationsHoverTimeoutRef.current) {
      clearTimeout(conversationsHoverTimeoutRef.current);
      conversationsHoverTimeoutRef.current = null;
    }
    
    conversationsCloseTimeoutRef.current = setTimeout(() => {
      if (!isHoveringConversationsSidebar) {
        setIsConversationsSidebarVisible(false);
      }
    }, 200);
  }, [isHoveringConversationsSidebar]);

  const handleConversationsSidebarHoverEnter = useCallback(() => {
    setIsHoveringConversationsSidebar(true);
    
    if (conversationsCloseTimeoutRef.current) {
      clearTimeout(conversationsCloseTimeoutRef.current);
      conversationsCloseTimeoutRef.current = null;
    }
  }, []);

  const handleConversationsSidebarHoverLeave = useCallback(() => {
    setIsHoveringConversationsSidebar(false);
    
    conversationsCloseTimeoutRef.current = setTimeout(() => {
      if (!isHoveringConversationsNav) {
        setIsConversationsSidebarVisible(false);
      }
    }, 200);
  }, [isHoveringConversationsNav]);

  const handleCloseConversationsSidebar = useCallback(() => {
    setIsConversationsSidebarVisible(false);
    setIsHoveringConversationsSidebar(false);
  }, []);

  const loadConversations = useCallback(async (useCache = true) => {
    if (!apiClient || !selectedTenant) return;
    
    if (!useCache) {
      setConversationsRefreshing(true);
    } else {
      setConversationsLoading(true);
    }
    setConversationsError(null);
    
    try {
      const [convsList, appsList] = await Promise.all([
        apiClient.listConversations(selectedTenant.id),
        apiClient.listApplications(selectedTenant.id, undefined, { noCache: !useCache }) as Promise<ApplicationResponse[]>,
      ]);
      setConversations(convsList);
      setConversationApplications(appsList);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      setConversationsError(t('failedToLoadConversations'));
    } finally {
      setConversationsLoading(false);
      setConversationsRefreshing(false);
    }
  }, [apiClient, selectedTenant]);

  useEffect(() => {
    if (isConversationsSidebarVisible && !isOnConversationsPage) {
      loadConversations(true);
    }
  }, [isConversationsSidebarVisible, isOnConversationsPage, loadConversations]);

  const handleRefreshConversations = useCallback(async () => {
    await loadConversations(false);
  }, [loadConversations]);

  const getApplicationName = useCallback((applicationId: string): string => {
    const app = conversationApplications.find(a => a.id === applicationId);
    return app?.name || 'Unknown Application';
  }, [conversationApplications]);

  const conversationItems: DataListItem[] = useMemo(() => {
    return conversations.map(conv => ({
      id: conv.id,
      name: conv.name,
      subtitle: getApplicationName(conv.application_id),
      link: `/conversations/${conv.id}`,
      icon: <IconMessages size={16} />,
    }));
  }, [conversations, getApplicationName]);

  const handleCloseDataList = useCallback(() => {
    setActiveEntity(null);
    setIsHoveringDataList(false);
  }, []);

  const handleToggleExpand = useCallback(() => {
    setIsDataListExpanded(prev => {
      const newValue = !prev;
      try {
        localStorage.setItem(SIDEBAR_EXPAND_KEY, String(newValue));
      } catch {
      }
      return newValue;
    });
  }, []);

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

  const handleApplicationCreated = useCallback(() => {
    refreshApplications();
  }, [refreshApplications]);

  const handleAutonomousAgentCreated = useCallback(() => {
    refreshAutonomousAgents();
  }, [refreshAutonomousAgents]);

  const handleChatWidgetCreated = useCallback(() => {
    refreshChatWidgets();
  }, [refreshChatWidgets]);

  const handleRefresh = useCallback(async () => {
    if (!activeEntity) return;
    
    setIsRefreshing(true);
    try {
      await refreshEntityData(activeEntity);
    } finally {
      setIsRefreshing(false);
    }
  }, [activeEntity, refreshEntityData]);

  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
      if (conversationsHoverTimeoutRef.current) clearTimeout(conversationsHoverTimeoutRef.current);
      if (conversationsCloseTimeoutRef.current) clearTimeout(conversationsCloseTimeoutRef.current);
    };
  }, []);

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
      if (isConversationsItem) {
        handleConversationsNavHoverEnter();
      }
      handleNavItemHoverEnter(item);
    };

    const handleMouseLeave = () => {
      if (isConversationsItem) {
        handleConversationsNavHoverLeave();
      }
      handleNavItemHoverLeave();
    };

    return (
      <Tooltip key={item.path} label={t(item.labelKey)} position="right" withArrow>
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
            {t(item.labelKey)}
          </Text>
        </UnstyledButton>
      </Tooltip>
    );
  };

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
          isFavorite={getIsFavoriteForEntity(activeEntity)}
        />
      )}

      {isConversationsSidebarVisible && !isOnConversationsPage && (
        <SidebarDataList
          title={t('conversations')}
          icon={<IconMessages size={24} />}
          items={conversationItems}
          isLoading={conversationsLoading}
          error={conversationsError}
          onClose={handleCloseConversationsSidebar}
          isExpanded={isDataListExpanded}
          onToggleExpand={handleToggleExpand}
          onMouseEnter={handleConversationsSidebarHoverEnter}
          onMouseLeave={handleConversationsSidebarHoverLeave}
          addButtonLabel={t('newConversation')}
          onAdd={() => navigate('/conversations')}
          onRefresh={handleRefreshConversations}
          isRefreshing={conversationsRefreshing}
          isFavorite={getIsFavoriteForEntity('conversations')}
        />
      )}

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
