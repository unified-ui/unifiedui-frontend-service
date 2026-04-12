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
  IconBrain,
  IconAppWindow,
} from '@tabler/icons-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSidebarData, useFavorites, type EntityType } from '../../../contexts';
import { EntityAvatar } from '../../common';
import { usePermissions, type ResourceType } from '../../../hooks';
import { SidebarDataList, type DataListItem } from './SidebarDataList';
import {
  CreateChatAgentDialog,
  CreateWorkflowDialog,
  CreateChatWidgetDialog,
  CreateExternalAppDialog,
} from '../../dialogs';
import { FavoriteResourceTypeEnum } from '../../../api/types';
import classes from './Sidebar.module.css';

interface NavItem {
  icon: typeof IconHome;
  iconFilled?: typeof IconHomeFilled;
  labelKey: string;
  path: string;
  visible?: boolean;
  hasDataList?: boolean;
  entityType?: EntityType;
  matchFn?: (pathname: string, search: string) => boolean;
  requiredResourceAccess?: ResourceType;
  envFlag?: string;
}

const mainNavItemsTop: NavItem[] = [
  { icon: IconHome, iconFilled: IconHomeFilled, labelKey: 'home', path: '/home' },
  { icon: IconMessages, iconFilled: IconMessageFilled, labelKey: 'chats', path: '/conversations' },
  {
    icon: IconSparkles,
    labelKey: 'agents',
    path: '/chat-agents',
    hasDataList: true,
    entityType: 'chat-agents',
    matchFn: (pathname, search) =>
      (pathname === '/chat-agents' || pathname.startsWith('/chat-agents/')) &&
      !search.includes('type=REACT_AGENT') &&
      !pathname.endsWith('/develop'),
  },
  { icon: IconRobot, labelKey: 'workflows', path: '/workflows', hasDataList: true, entityType: 'workflows' },
  {
    icon: IconAppWindow,
    labelKey: 'apps',
    path: '/external-apps',
    hasDataList: true,
    entityType: 'external-apps',
    requiredResourceAccess: 'external-apps',
    envFlag: 'VITE_SHOW_EXTERNAL_APPS_PAGE',
  },
];

const mainNavItemsBottom: NavItem[] = [
  {
    icon: IconBrandWechat,
    labelKey: 'widgets',
    path: '/chat-widgets',
    hasDataList: true,
    entityType: 'chat-widgets',
    matchFn: (pathname) =>
      pathname === '/chat-widgets' ||
      pathname.startsWith('/chat-widgets/') ||
      pathname.startsWith('/widget-designer/'),
  },
  {
    icon: IconBrain,
    labelKey: 'reactAgents',
    path: '/chat-agents?type=REACT_AGENT',
    visible: false,
    requiredResourceAccess: 'tools',
    envFlag: 'VITE_SHOW_RE_ACT_AGENT_DEVELOPMENT_PAGE',
    matchFn: (pathname, search) =>
      (pathname === '/chat-agents' && search.includes('type=REACT_AGENT')) ||
      pathname.endsWith('/develop'),
  },
];

const bottomNavItems: NavItem[] = [
  { icon: IconSettings, iconFilled: IconSettingsFilled, labelKey: 'settings', path: '/tenant-settings?tab=iam' },
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
    chatAgents,
    workflows,
    chatWidgets,
    externalApps,
    conversations,
    loadingStates,
    errorStates,
    fetchEntityData,
    fetchChatAgents,
    fetchConversations,
    refreshEntityData,
    refreshChatAgents,
    refreshWorkflows,
    refreshChatWidgets,
    refreshExternalApps,
    refreshConversations,
  } = useSidebarData();

  const { isFavorite: checkFavorite, toggleFavorite } = useFavorites();
  const { canCreate } = usePermissions();

  const isEnvFlagEnabled = useCallback((flag?: string): boolean => {
    if (!flag) return true;
    const value = import.meta.env[flag];
    return value !== 'false' && value !== '0';
  }, []);

  const visibleNavItemsTop = useMemo(
    () => mainNavItemsTop.filter(item =>
      (item.visible !== false) &&
      isEnvFlagEnabled(item.envFlag) &&
      (!item.requiredResourceAccess || canCreate(item.requiredResourceAccess))),
    [canCreate, isEnvFlagEnabled],
  );

  const visibleNavItemsBottom = useMemo(
    () => mainNavItemsBottom.filter(item =>
      (item.visible !== false) &&
      isEnvFlagEnabled(item.envFlag) &&
      (!item.requiredResourceAccess || canCreate(item.requiredResourceAccess))),
    [canCreate, isEnvFlagEnabled],
  );

  const ENTITY_TO_FAVORITE_TYPE: Record<string, FavoriteResourceTypeEnum> = useMemo(() => ({
    'chat-agents': FavoriteResourceTypeEnum.CHAT_AGENT,
    'workflows': FavoriteResourceTypeEnum.AUTONOMOUS_AGENT,
    'chat-widgets': FavoriteResourceTypeEnum.CHAT_WIDGET,
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

  const getToggleFavoriteForEntity = useCallback(
    (entityType: EntityType | 'conversations') => {
      const favType = ENTITY_TO_FAVORITE_TYPE[entityType];
      if (!favType) return undefined;
      return (id: string, name: string) => toggleFavorite(favType, id, name);
    },
    [toggleFavorite, ENTITY_TO_FAVORITE_TYPE]
  );

  const [activeEntity, setActiveEntity] = useState<EntityType | null>(null);
  const canAddEntity = activeEntity ? canCreate(activeEntity) : false;
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
  const [conversationsRefreshing, setConversationsRefreshing] = useState(false);

  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const conversationsHoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const conversationsCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const [isChatAgentDialogOpen, setIsChatAgentDialogOpen] = useState(false);
  const [isWorkflowDialogOpen, setIsWorkflowDialogOpen] = useState(false);
  const [isChatWidgetDialogOpen, setIsChatWidgetDialogOpen] = useState(false);
  const [isExternalAppDialogOpen, setIsExternalAppDialogOpen] = useState(false);

  const entityConfigs = useMemo<Partial<Record<EntityType, EntityConfig>>>(() => ({
    'chat-agents': {
      title: t('chatAgents'),
      icon: <IconSparkles size={24} />,
      addButtonLabel: t('addChatAgent'),
      fetchData: () => fetchEntityData('chat-agents'),
      getLink: (id) => `/conversations?chat-agent=${id}`,
    },
    'workflows': {
      title: t('workflows'),
      icon: <IconRobot size={24} />,
      addButtonLabel: t('addWorkflow'),
      fetchData: () => fetchEntityData('workflows'),
      getLink: (id) => `/workflows/${id}`,
    },
    'chat-widgets': {
      title: t('chatWidgets'),
      icon: <IconBrandWechat size={24} />,
      addButtonLabel: t('addChatWidget'),
      fetchData: () => fetchEntityData('chat-widgets'),
      getLink: (id) => `/widget-designer/${id}`,
    },
    'external-apps': {
      title: t('externalApps'),
      icon: <IconAppWindow size={24} />,
      addButtonLabel: t('addExternalApp'),
      fetchData: () => fetchEntityData('external-apps'),
      getLink: (id) => `/external-apps/${id}`,
    },
  }), [fetchEntityData, t]);

  const dataListItems: DataListItem[] = useMemo(() => {
    if (!activeEntity) return [];

    switch (activeEntity) {
      case 'chat-agents':
        return chatAgents.map(app => ({
          id: app.id,
          name: app.name,
          link: entityConfigs['chat-agents']!.getLink(app.id),
          icon: <EntityAvatar entityType="chat-agent" size="xs" />,
        }));
      case 'workflows':
        return workflows.map(agent => ({
          id: agent.id,
          name: agent.name,
          link: entityConfigs['workflows']!.getLink(agent.id),
          icon: <EntityAvatar entityType="workflow" size="xs" />,
        }));
      case 'chat-widgets':
        return chatWidgets.map(widget => ({
          id: widget.id,
          name: widget.name,
          link: entityConfigs['chat-widgets']!.getLink(widget.id),
          icon: <EntityAvatar entityType="chat-widget" size="xs" />,
        }));
      case 'external-apps':
        return externalApps.map(app => ({
          id: app.id,
          name: app.name,
          link: entityConfigs['external-apps']!.getLink(app.id),
          icon: <IconAppWindow size={16} />,
        }));
      default:
        return [];
    }
  }, [activeEntity, chatAgents, workflows, chatWidgets, externalApps, entityConfigs]);

  const isOnEntityDetailPage = useCallback((entityType: EntityType) => {
    const detailPatterns: Partial<Record<EntityType, RegExp>> = {
      'chat-agents': /^\/chat-agents\/[^/]+/,
      'workflows': /^\/workflows\/[^/]+/,
      'chat-widgets': /^\/(widget-designer|chat-widgets)\/[^/]+/,
      'external-apps': /^\/external-apps\/[^/]+/,
    };
    const pattern = detailPatterns[entityType];
    return pattern ? pattern.test(location.pathname) : false;
  }, [location.pathname]);

  const handleNavItemHoverEnter = useCallback((item: NavItem) => {
    if (!item.hasDataList || !item.entityType) return;
    if (!isOnEntityDetailPage(item.entityType as EntityType)) return;

    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = undefined;
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
  }, [entityConfigs, isOnEntityDetailPage]);

  const handleNavItemHoverLeave = useCallback(() => {
    setIsHoveringNavItem(false);

    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = undefined;
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
      closeTimeoutRef.current = undefined;
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
    return; // Feature disabled
    if (isOnConversationsPage) return;

    if (conversationsCloseTimeoutRef.current) {
      clearTimeout(conversationsCloseTimeoutRef.current);
      conversationsCloseTimeoutRef.current = undefined;
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
      conversationsHoverTimeoutRef.current = undefined;
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
      conversationsCloseTimeoutRef.current = undefined;
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

  useEffect(() => {
    if (isConversationsSidebarVisible && !isOnConversationsPage) {
      fetchConversations();
      fetchChatAgents();
    }
  }, [isConversationsSidebarVisible, isOnConversationsPage, fetchConversations, fetchChatAgents]);

  const handleRefreshConversations = useCallback(async () => {
    setConversationsRefreshing(true);
    try {
      await refreshConversations();
    } finally {
      setConversationsRefreshing(false);
    }
  }, [refreshConversations]);

  const getChatAgentName = useCallback((chatAgentId: string): string => {
    const app = chatAgents.find(a => a.id === chatAgentId);
    return app?.name || 'Unknown Chat Agent';
  }, [chatAgents]);

  const conversationItems: DataListItem[] = useMemo(() => {
    return conversations.map(conv => ({
      id: conv.id,
      name: conv.name,
      subtitle: getChatAgentName(conv.chat_agent_id),
      link: `/conversations/${conv.id}`,
      icon: <IconMessages size={16} />,
    }));
  }, [conversations, getChatAgentName]);

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
        /* ignore */
      }
      return newValue;
    });
  }, []);

  const handleAddClick = useCallback(async () => {
    if (!activeEntity) return;

    switch (activeEntity) {
      case 'chat-agents':
        setIsChatAgentDialogOpen(true);
        break;
      case 'workflows':
        setIsWorkflowDialogOpen(true);
        break;
      case 'chat-widgets':
        setIsChatWidgetDialogOpen(true);
        break;
      case 'external-apps':
        setIsExternalAppDialogOpen(true);
        break;
    }
  }, [activeEntity]);

  const handleChatAgentCreated = useCallback(() => {
    refreshChatAgents();
  }, [refreshChatAgents]);

  const handleWorkflowCreated = useCallback(() => {
    refreshWorkflows();
  }, [refreshWorkflows]);

  const handleChatWidgetCreated = useCallback(() => {
    refreshChatWidgets();
  }, [refreshChatWidgets]);

  const handleExternalAppCreated = useCallback(() => {
    refreshExternalApps();
  }, [refreshExternalApps]);

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
    const isActive = item.matchFn
      ? item.matchFn(location.pathname, location.search)
      : location.pathname === item.path || location.pathname.startsWith(item.path + '/');
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
          {visibleNavItemsTop.map(renderNavItem)}
          <Divider className={classes.navDivider} />
          {visibleNavItemsBottom.map(renderNavItem)}
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
          onAdd={canAddEntity ? handleAddClick : undefined}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          isFavorite={getIsFavoriteForEntity(activeEntity)}
          onToggleFavorite={getToggleFavoriteForEntity(activeEntity)}
        />
      )}

      {isConversationsSidebarVisible && !isOnConversationsPage && (
        <SidebarDataList
          title={t('conversations')}
          icon={<IconMessages size={24} />}
          items={conversationItems}
          isLoading={loadingStates.conversations}
          error={errorStates.conversations}
          onClose={handleCloseConversationsSidebar}
          isExpanded={isDataListExpanded}
          onToggleExpand={handleToggleExpand}
          onMouseEnter={handleConversationsSidebarHoverEnter}
          onMouseLeave={handleConversationsSidebarHoverLeave}
          addButtonLabel={t('newConversation')}
          onAdd={canCreate('conversations') ? () => navigate('/conversations') : undefined}
          onRefresh={handleRefreshConversations}
          isRefreshing={conversationsRefreshing}
          isFavorite={getIsFavoriteForEntity('conversations')}
          onToggleFavorite={getToggleFavoriteForEntity('conversations')}
        />
      )}

      <CreateChatAgentDialog
        opened={isChatAgentDialogOpen}
        onClose={() => setIsChatAgentDialogOpen(false)}
        onSuccess={handleChatAgentCreated}
      />
      <CreateWorkflowDialog
        opened={isWorkflowDialogOpen}
        onClose={() => setIsWorkflowDialogOpen(false)}
        onSuccess={handleWorkflowCreated}
      />
      <CreateChatWidgetDialog
        opened={isChatWidgetDialogOpen}
        onClose={() => setIsChatWidgetDialogOpen(false)}
        onSuccess={handleChatWidgetCreated}
      />
      <CreateExternalAppDialog
        opened={isExternalAppDialogOpen}
        onClose={() => setIsExternalAppDialogOpen(false)}
        onSuccess={handleExternalAppCreated}
      />
    </>
  );
};
