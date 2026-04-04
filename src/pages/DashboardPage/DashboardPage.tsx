import type { FC } from 'react';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack, Button, Skeleton, Menu, Badge } from '@mantine/core';
import {
  IconSparkles,
  IconRobot,
  IconMessages,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconPlus,
  IconBrandWechat,
  IconAppWindow,
  IconKey,
  IconTool,
  IconCpu,
  IconUsers,
  IconUsersGroup,
  IconStar,
  IconStarFilled,
} from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { EntityAvatar } from '../../components/common';
import type { EntityAvatarType } from '../../components/common';
import { useIdentity, useFavorites, useRecentVisits, useSidebarData } from '../../contexts';
import { usePermissions } from '../../hooks/usePermissions';
import { FavoriteResourceTypeEnum } from '../../api/types';
import type { DashboardStatsResponse } from '../../api/types';
import { DelayedTooltip } from '../../components/common';
import classes from './DashboardPage.module.css';

const STAT_CARDS = [
  { key: 'chat_agents' as const, icon: IconSparkles, color: 'var(--color-primary-100)', iconColor: 'var(--color-primary-600)', route: '/chat-agents' },
  { key: 'workflows' as const, icon: IconRobot, color: 'var(--color-secondary-100)', iconColor: 'var(--color-secondary-600)', route: '/workflows' },
  { key: 'conversations' as const, icon: IconMessages, color: 'var(--color-accent-100)', iconColor: 'var(--color-accent-600)', route: '/conversations' },
] as const;

const INITIAL_FAVORITES_COUNT = 6;

const FAVORITE_ROUTE_MAP: Record<string, string> = {
  [FavoriteResourceTypeEnum.CHAT_AGENT]: '/chat-agents',
  [FavoriteResourceTypeEnum.AUTONOMOUS_AGENT]: '/workflows',
  [FavoriteResourceTypeEnum.CONVERSATION]: '/conversations',
  [FavoriteResourceTypeEnum.EXTERNAL_APP]: '/external-apps',
  [FavoriteResourceTypeEnum.CHAT_WIDGET]: '/widget-designer',
};

const FAVORITE_TYPE_LABEL_KEYS: Record<string, string> = {
  [FavoriteResourceTypeEnum.CHAT_AGENT]: 'chatAgent',
  [FavoriteResourceTypeEnum.AUTONOMOUS_AGENT]: 'workflow',
  [FavoriteResourceTypeEnum.CONVERSATION]: 'conversation',
  [FavoriteResourceTypeEnum.EXTERNAL_APP]: 'externalApp',
  [FavoriteResourceTypeEnum.CHAT_WIDGET]: 'chatWidget',
};

const FAVORITE_TYPE_TO_ENTITY: Record<string, EntityAvatarType> = {
  [FavoriteResourceTypeEnum.CHAT_AGENT]: 'chat-agent',
  [FavoriteResourceTypeEnum.AUTONOMOUS_AGENT]: 'workflow',
  [FavoriteResourceTypeEnum.CONVERSATION]: 'conversation',
  [FavoriteResourceTypeEnum.EXTERNAL_APP]: 'external-app',
  [FavoriteResourceTypeEnum.CHAT_WIDGET]: 'chat-widget',
};

const RESOURCE_ROUTE_MAP: Record<string, string> = {
  chat_agent: '/chat-agents',
  workflow: '/workflows',
  conversation: '/conversations',
  chat_widget: '/chat-widgets',
  external_app: '/external-apps',
};

const RESOURCE_TYPE_LABEL_KEYS: Record<string, string> = {
  chat_agent: 'chatAgent',
  workflow: 'workflow',
  conversation: 'conversation',
  chat_widget: 'chatWidget',
  external_app: 'externalApp',
};

const RESOURCE_TYPE_BADGE_COLORS: Record<string, string> = {
  chat_agent: 'teal',
  workflow: 'violet',
  conversation: 'blue',
  chat_widget: 'orange',
  external_app: 'pink',
};

const RESOURCE_TYPE_TO_ENTITY: Record<string, EntityAvatarType> = {
  chat_agent: 'chat-agent',
  workflow: 'workflow',
  conversation: 'conversation',
  chat_widget: 'chat-widget',
  external_app: 'external-app',
};

const RESOURCE_ICON_COLORS: Record<string, { bg: string; fg: string }> = {
  chat_agent: { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-600)' },
  workflow: { bg: 'var(--color-secondary-100)', fg: 'var(--color-secondary-600)' },
  conversation: { bg: 'var(--color-accent-100)', fg: 'var(--color-accent-600)' },
  chat_widget: { bg: 'var(--mantine-color-orange-1)', fg: 'var(--mantine-color-orange-6)' },
  external_app: { bg: 'var(--mantine-color-pink-1)', fg: 'var(--mantine-color-pink-6)' },
};

const RESOURCE_ICONS: Record<string, FC<{ size?: number; style?: React.CSSProperties }>> = {
  chat_agent: IconSparkles,
  workflow: IconRobot,
  conversation: IconMessages,
  chat_widget: IconBrandWechat,
  external_app: IconAppWindow,
};

const FAVORITE_ICON_COLORS: Record<string, { bg: string; fg: string }> = {
  [FavoriteResourceTypeEnum.CHAT_AGENT]: { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-600)' },
  [FavoriteResourceTypeEnum.AUTONOMOUS_AGENT]: { bg: 'var(--color-secondary-100)', fg: 'var(--color-secondary-600)' },
  [FavoriteResourceTypeEnum.CONVERSATION]: { bg: 'var(--color-accent-100)', fg: 'var(--color-accent-600)' },
  [FavoriteResourceTypeEnum.EXTERNAL_APP]: { bg: 'var(--mantine-color-pink-1)', fg: 'var(--mantine-color-pink-6)' },
  [FavoriteResourceTypeEnum.CHAT_WIDGET]: { bg: 'var(--mantine-color-orange-1)', fg: 'var(--mantine-color-orange-6)' },
};

const FAVORITE_ICONS: Record<string, FC<{ size?: number; style?: React.CSSProperties }>> = {
  [FavoriteResourceTypeEnum.CHAT_AGENT]: IconSparkles,
  [FavoriteResourceTypeEnum.AUTONOMOUS_AGENT]: IconRobot,
  [FavoriteResourceTypeEnum.CONVERSATION]: IconMessages,
  [FavoriteResourceTypeEnum.EXTERNAL_APP]: IconAppWindow,
  [FavoriteResourceTypeEnum.CHAT_WIDGET]: IconBrandWechat,
};

type CreateMenuResourceType = 'chat-agents' | 'workflows' | 'chat-widgets' | 'external-apps' | 'credentials' | 'tools' | 'tenant-ai-models' | 'custom-groups';

interface CreateMenuItem {
  labelKey: string;
  icon: FC<{ size?: number }>;
  resourceType: CreateMenuResourceType;
  route: string;
}

const CREATE_MENU_ITEMS: CreateMenuItem[] = [
  { labelKey: 'createChatAgent', icon: IconSparkles, resourceType: 'chat-agents', route: '/chat-agents?dialog=new' },
  { labelKey: 'createWorkflow', icon: IconRobot, resourceType: 'workflows', route: '/workflows?dialog=new' },
  { labelKey: 'createChatWidget', icon: IconBrandWechat, resourceType: 'chat-widgets', route: '/chat-widgets?dialog=new' },
  { labelKey: 'createExternalApp', icon: IconAppWindow, resourceType: 'external-apps', route: '/external-apps?dialog=new' },
  { labelKey: 'createCredential', icon: IconKey, resourceType: 'credentials', route: '/tenant-settings?tab=credentials&dialog=new-credential' },
  { labelKey: 'createTool', icon: IconTool, resourceType: 'tools', route: '/tenant-settings?tab=tools&dialog=new-tool' },
  { labelKey: 'createAIModel', icon: IconCpu, resourceType: 'tenant-ai-models', route: '/tenant-settings?tab=ai-models&dialog=new-ai-model' },
  { labelKey: 'createCustomGroup', icon: IconUsersGroup, resourceType: 'custom-groups', route: '/tenant-settings?tab=custom-groups&dialog=new-custom-group' },
  { labelKey: 'addPrincipal', icon: IconUsers, resourceType: 'custom-groups', route: '/tenant-settings?tab=iam&dialog=add-member' },
];

const formatRelativeTime = (dateStr: string): string => {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHrs = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(dateStr).toLocaleDateString();
};

export const DashboardPage: FC = () => {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { user, selectedTenant, apiClient, isLoading: isIdentityLoading } = useIdentity();
  const { favorites, isFavorite, getFavoriteName } = useFavorites();
  const { recentVisits } = useRecentVisits();
  const { chatAgents, workflows } = useSidebarData();
  const { canCreate } = usePermissions();

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [showAllFavorites, setShowAllFavorites] = useState(false);

  const galleryRef = useRef<HTMLDivElement>(null);
  const [_canScrollLeft, setCanScrollLeft] = useState(false);
  const [_canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(true), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!apiClient || !selectedTenant) {
      setIsStatsLoading(false);
      return;
    }

    const fetchStats = async () => {
      setIsStatsLoading(true);
      try {
        const data = await apiClient.getDashboardStats(selectedTenant.id);
        setStats(data);
      } catch (error) {
        console.error('Failed to load dashboard stats:', error);
      } finally {
        setIsStatsLoading(false);
      }
    };

    fetchStats();
  }, [apiClient, selectedTenant]);

  const updateScrollButtons = useCallback(() => {
    const el = galleryRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1);
  }, []);

  useEffect(() => {
    if (recentVisits.length === 0) return;
    const rafId = requestAnimationFrame(() => {
      const el = galleryRef.current;
      if (!el) return;
      updateScrollButtons();
      el.addEventListener('scroll', updateScrollButtons, { passive: true });
      const observer = new ResizeObserver(updateScrollButtons);
      observer.observe(el);
    });
    return () => {
      cancelAnimationFrame(rafId);
      const el = galleryRef.current;
      if (el) {
        el.removeEventListener('scroll', updateScrollButtons);
      }
    };
  }, [updateScrollButtons, recentVisits]);

  const scrollGallery = useCallback((direction: 'left' | 'right') => {
    const el = galleryRef.current;
    if (!el) return;
    const scrollAmount = 180;
    el.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
  }, []);

  const favoriteItems = useMemo(() => {
    const items: Array<{ id: string; name: string; type: FavoriteResourceTypeEnum }> = [];
    const entityMap = new Map<string, string>();

    chatAgents.forEach(app => entityMap.set(app.id, app.name));
    workflows.forEach(agent => entityMap.set(agent.id, agent.name));

    for (const [type, ids] of favorites.entries()) {
      for (const id of ids) {
        const name = entityMap.get(id) || getFavoriteName(id) || id;
        items.push({ id, name, type });
      }
    }

    return items;
  }, [favorites, chatAgents, workflows, getFavoriteName]);

  const visibleFavorites = useMemo(() => {
    return showAllFavorites ? favoriteItems : favoriteItems.slice(0, INITIAL_FAVORITES_COUNT);
  }, [favoriteItems, showAllFavorites]);

  const isDataReady = !isIdentityLoading && !isStatsLoading;
  const isLoading = showSkeleton && !isDataReady;

  const statLabels: Record<string, string> = {
    chat_agents: t('chatAgents'),
    workflows: t('workflows'),
    conversations: t('conversations'),
  };

  const allowedCreateItems = useMemo(
    () => CREATE_MENU_ITEMS.filter(item => canCreate(item.resourceType)),
    [canCreate]
  );

  if (!isDataReady && !showSkeleton) {
    return <MainLayout><></></MainLayout>;
  }

  return (
    <MainLayout>
      <div className={classes.pageWrapper}>
        <div className={classes.stickyHeader}>
          <div className={classes.headerRow}>
            <div className={classes.greeting}>
              {isLoading ? (
                <>
                  <Skeleton height={30} width="40%" radius="sm" mb={8} />
                  <Skeleton height={16} width="30%" radius="sm" />
                </>
              ) : (
                <>
                  <div className={classes.greetingTitle}>
                    {t('welcomeBack', { userName: user?.display_name || 'User' })}
                  </div>
                  {selectedTenant && (
                    <div className={classes.greetingSubtitle}>
                      {t('tenantSubtitle', { tenantName: selectedTenant.name })}
                    </div>
                  )}
                </>
              )}
            </div>
            {allowedCreateItems.length > 0 && !isLoading && (
              <Menu shadow="md" width={220} position="bottom-end">
                <Menu.Target>
                  <Button
                    leftSection={<IconPlus size={16} />}
                    rightSection={<IconChevronDown size={14} />}
                    variant="light"
                    size="sm"
                  >
                    {t('create')}
                  </Button>
                </Menu.Target>
                <Menu.Dropdown>
                  {allowedCreateItems.map(item => (
                    <Menu.Item
                      key={item.labelKey}
                      leftSection={<item.icon size={16} />}
                      onClick={() => navigate(item.route)}
                    >
                      {t(item.labelKey)}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
            )}
          </div>
        </div>

        <Stack gap="lg">
          <div className={classes.statsGrid}>
            {STAT_CARDS.map(({ key, icon: Icon, color, iconColor, route }) => {
              const entityStats = stats?.[key];
              return (
                <div
                  key={key}
                  className={classes.statCard}
                  onClick={() => navigate(route)}
                >
                  <div className={classes.statIconWrapper} style={{ background: color }}>
                    <Icon size={20} style={{ color: iconColor }} />
                  </div>
                  {isLoading ? (
                    <Stack gap={6} style={{ flex: 1 }}>
                      <Skeleton height={28} width="50%" radius="sm" />
                      <Skeleton height={12} width="40%" radius="sm" />
                      <Skeleton height={10} width="60%" radius="sm" />
                    </Stack>
                  ) : (
                    <>
                      <div className={classes.statValue}>
                        {entityStats?.total ?? '–'}
                      </div>
                      <div className={classes.statLabel}>{statLabels[key]}</div>
                      {entityStats && (
                        <div className={classes.statMeta}>
                          {t('activeCount', { count: entityStats.active })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <div className={classes.section}>
            <div className={classes.sectionHeader}>
              <span className={classes.sectionTitle}>{t('recentlyVisited')}</span>
              {recentVisits.length > 0 && (
                <div className={classes.headerArrows}>
                  <button
                    className={classes.galleryArrow}
                    onClick={() => scrollGallery('left')}
                    type="button"
                  >
                    <IconChevronLeft size={16} />
                  </button>
                  <button
                    className={classes.galleryArrow}
                    onClick={() => scrollGallery('right')}
                    type="button"
                  >
                    <IconChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
            {isLoading ? (
              <div className={classes.galleryWrapper}>
                <div className={classes.galleryTrack}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={classes.recentCard} style={{ cursor: 'default' }}>
                      <Skeleton height={32} width={32} radius="xl" mb="xs" />
                      <Skeleton height={14} width="80%" radius="sm" mb={4} />
                      <Skeleton height={18} width="60%" radius="xl" mb={4} />
                      <Skeleton height={10} width="50%" radius="sm" />
                    </div>
                  ))}
                </div>
              </div>
            ) : recentVisits.length > 0 ? (
              <div className={classes.galleryContainer}>
                <div className={classes.galleryWrapper} ref={galleryRef}>
                  <div className={classes.galleryTrack}>
                    {recentVisits.map(item => {
                      const isFav = isFavorite(
                        item.resource_type as FavoriteResourceTypeEnum,
                        item.resource_id
                      );
                      const iconColors = RESOURCE_ICON_COLORS[item.resource_type];
                      const IconComp = RESOURCE_ICONS[item.resource_type];
                      const route = item.resource_type === 'chat_agent'
                        ? `/conversations?chat-agent=${item.resource_id}&selected=${item.resource_id}`
                        : `${RESOURCE_ROUTE_MAP[item.resource_type] || '/'}/${item.resource_id}`;
                      return (
                        <div
                          key={item.id}
                          className={classes.recentCard}
                          onClick={() => navigate(route)}
                        >
                          {isFav && (
                            <div className={classes.recentCardStar}>
                              <IconStarFilled size={12} />
                            </div>
                          )}
                          {IconComp && iconColors ? (
                            <div
                              className={classes.cardIconWrapper}
                              style={{ background: iconColors.bg }}
                            >
                              <IconComp size={20} style={{ color: iconColors.fg }} />
                            </div>
                          ) : (
                            <EntityAvatar
                              entityType={RESOURCE_TYPE_TO_ENTITY[item.resource_type] || 'chat-agent'}
                              size="sm"
                            />
                          )}
                          <DelayedTooltip label={item.resource_name}>
                            <div className={classes.recentCardName}>{item.resource_name}</div>
                          </DelayedTooltip>
                          <Badge
                            size="xs"
                            variant="light"
                            color={RESOURCE_TYPE_BADGE_COLORS[item.resource_type] || 'gray'}
                          >
                            {tCommon(RESOURCE_TYPE_LABEL_KEYS[item.resource_type] || item.resource_type)}
                          </Badge>
                          <div className={classes.recentCardTime}>
                            {formatRelativeTime(item.visited_at)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className={classes.emptySection}>{t('noRecentVisits')}</div>
            )}
          </div>

          <div className={classes.section}>
            <div className={classes.sectionHeader}>
              <span className={classes.sectionTitle}>
                <IconStar size={16} style={{ marginRight: 6, verticalAlign: 'text-bottom' }} />
                {t('favorites')}
              </span>
              {favoriteItems.length > INITIAL_FAVORITES_COUNT && (
                <Button
                  variant="subtle"
                  size="compact-xs"
                  onClick={() => setShowAllFavorites(prev => !prev)}
                >
                  {showAllFavorites ? t('showLess') : t('showMore', { count: favoriteItems.length })}
                </Button>
              )}
            </div>
            {isLoading ? (
              <div className={classes.entityGrid}>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={classes.entityCard} style={{ cursor: 'default' }}>
                    <Skeleton height={32} width={32} radius="xl" />
                    <Stack gap={4} style={{ flex: 1 }}>
                      <Skeleton height={14} width="70%" radius="sm" />
                      <Skeleton height={12} width="40%" radius="sm" />
                    </Stack>
                  </div>
                ))}
              </div>
            ) : visibleFavorites.length > 0 ? (
              <div className={classes.entityGrid}>
                {visibleFavorites.map(item => {
                  const iconColors = FAVORITE_ICON_COLORS[item.type];
                  const IconComp = FAVORITE_ICONS[item.type];
                  const route = item.type === FavoriteResourceTypeEnum.CHAT_AGENT
                    ? `/conversations?chat-agent=${item.id}&selected=${item.id}`
                    : `${FAVORITE_ROUTE_MAP[item.type]}/${item.id}`;
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      className={classes.entityCard}
                      onClick={() => navigate(route)}
                    >
                      {IconComp && iconColors ? (
                        <div
                          className={classes.cardIconWrapper}
                          style={{ background: iconColors.bg }}
                        >
                          <IconComp size={20} style={{ color: iconColors.fg }} />
                        </div>
                      ) : (
                        <EntityAvatar entityType={FAVORITE_TYPE_TO_ENTITY[item.type] || 'chat-agent'} size="sm" />
                      )}
                      <div className={classes.entityCardContent}>
                        <DelayedTooltip label={item.name}>
                          <div className={classes.entityCardName}>{item.name}</div>
                        </DelayedTooltip>
                        <div className={classes.entityCardType}>
                          {tCommon(FAVORITE_TYPE_LABEL_KEYS[item.type])}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={classes.emptySection}>{t('noFavorites')}</div>
            )}
          </div>
        </Stack>
      </div>
    </MainLayout>
  );
};
