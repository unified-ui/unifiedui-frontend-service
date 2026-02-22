import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Stack, Button, Skeleton } from '@mantine/core';
import { IconSparkles, IconRobot, IconMessages, IconArrowRight } from '@tabler/icons-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { EntityAvatar } from '../../components/common';
import type { EntityAvatarType } from '../../components/common';
import { useIdentity, useFavorites, useRecentVisits, useSidebarData } from '../../contexts';
import { FavoriteResourceTypeEnum } from '../../api/types';
import type { DashboardStatsResponse } from '../../api/types';
import { DelayedTooltip } from '../../components/common';
import classes from './DashboardPage.module.css';

const STAT_CARDS = [
  { key: 'chat_agents' as const, icon: IconSparkles, color: 'var(--color-primary-100)', iconColor: 'var(--color-primary-600)', route: '/chat-agents' },
  { key: 'autonomous_agents' as const, icon: IconRobot, color: 'var(--color-secondary-100)', iconColor: 'var(--color-secondary-600)', route: '/autonomous-agents' },
  { key: 'conversations' as const, icon: IconMessages, color: 'var(--color-accent-100)', iconColor: 'var(--color-accent-600)', route: '/conversations' },
] as const;

const FAVORITE_ROUTE_MAP: Record<string, string> = {
  [FavoriteResourceTypeEnum.CHAT_AGENT]: '/chat-agents',
  [FavoriteResourceTypeEnum.AUTONOMOUS_AGENT]: '/autonomous-agents',
  [FavoriteResourceTypeEnum.CONVERSATION]: '/conversations',
};

const FAVORITE_TYPE_LABEL_KEYS: Record<string, string> = {
  [FavoriteResourceTypeEnum.CHAT_AGENT]: 'chatAgent',
  [FavoriteResourceTypeEnum.AUTONOMOUS_AGENT]: 'autonomousAgent',
  [FavoriteResourceTypeEnum.CONVERSATION]: 'conversation',
};

const FAVORITE_TYPE_TO_ENTITY: Record<string, EntityAvatarType> = {
  [FavoriteResourceTypeEnum.CHAT_AGENT]: 'chat-agent',
  [FavoriteResourceTypeEnum.AUTONOMOUS_AGENT]: 'autonomous-agent',
  [FavoriteResourceTypeEnum.CONVERSATION]: 'conversation',
};

const RESOURCE_ROUTE_MAP: Record<string, string> = {
  chat_agent: '/chat-agents',
  autonomous_agent: '/autonomous-agents',
  conversation: '/conversations',
};

const RESOURCE_TYPE_TO_ENTITY: Record<string, EntityAvatarType> = {
  chat_agent: 'chat-agent',
  autonomous_agent: 'autonomous-agent',
  conversation: 'conversation',
};

export const DashboardPage: FC = () => {
  const { t } = useTranslation('dashboard');
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { user, selectedTenant, apiClient, isLoading: isIdentityLoading } = useIdentity();
  const { favorites } = useFavorites();
  const { recentVisits } = useRecentVisits();
  const { chatAgents, autonomousAgents } = useSidebarData();

  const [stats, setStats] = useState<DashboardStatsResponse | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

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

  const favoriteItems = useMemo(() => {
    const items: Array<{ id: string; name: string; type: FavoriteResourceTypeEnum }> = [];
    const entityMap = new Map<string, string>();

    chatAgents.forEach(app => entityMap.set(app.id, app.name));
    autonomousAgents.forEach(agent => entityMap.set(agent.id, agent.name));

    for (const [type, ids] of favorites.entries()) {
      for (const id of ids) {
        const name = entityMap.get(id) || id;
        items.push({ id, name, type });
      }
    }

    return items.slice(0, 6);
  }, [favorites, chatAgents, autonomousAgents]);

  const recentItems = useMemo(() => recentVisits.slice(0, 6), [recentVisits]);

  const isDataReady = !isIdentityLoading && !isStatsLoading;
  const isLoading = showSkeleton && !isDataReady;

  const statLabels: Record<string, string> = {
    chat_agents: t('chatAgents'),
    autonomous_agents: t('autonomousAgents'),
    conversations: t('conversations'),
  };

  if (!isDataReady && !showSkeleton) {
    return <MainLayout><></></MainLayout>;
  }

  return (
    <MainLayout>
      <Stack gap="lg">
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
            <span className={classes.sectionTitle}>{t('favorites')}</span>
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
          ) : favoriteItems.length > 0 ? (
            <div className={classes.entityGrid}>
              {favoriteItems.map(item => (
                <div
                  key={`${item.type}-${item.id}`}
                  className={classes.entityCard}
                  onClick={() => navigate(`${FAVORITE_ROUTE_MAP[item.type]}/${item.id}`)}
                >
                  <EntityAvatar entityType={FAVORITE_TYPE_TO_ENTITY[item.type] || 'chat-agent'} size="sm" />
                  <div className={classes.entityCardContent}>
                    <DelayedTooltip label={item.name}>
                      <div className={classes.entityCardName}>{item.name}</div>
                    </DelayedTooltip>
                    <div className={classes.entityCardType}>
                      {tCommon(FAVORITE_TYPE_LABEL_KEYS[item.type])}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={classes.emptySection}>{t('noFavorites')}</div>
          )}
        </div>

        <div className={classes.section}>
          <div className={classes.sectionHeader}>
            <span className={classes.sectionTitle}>{t('recentlyVisited')}</span>
            {!isLoading && recentItems.length > 0 && (
              <Button
                variant="subtle"
                size="compact-xs"
                rightSection={<IconArrowRight size={14} />}
                onClick={() => navigate('/dashboard')}
              >
                {t('viewAll')}
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
          ) : recentItems.length > 0 ? (
            <div className={classes.entityGrid}>
              {recentItems.map(item => (
                <div
                  key={item.id}
                  className={classes.entityCard}
                  onClick={() => navigate(`${RESOURCE_ROUTE_MAP[item.resource_type] || '/'}/${item.resource_id}`)}
                >
                  <EntityAvatar entityType={RESOURCE_TYPE_TO_ENTITY[item.resource_type] || 'chat-agent'} size="sm" />
                  <div className={classes.entityCardContent}>
                    <DelayedTooltip label={item.resource_name}>
                      <div className={classes.entityCardName}>{item.resource_name}</div>
                    </DelayedTooltip>
                    <div className={classes.entityCardType}>{item.resource_type}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={classes.emptySection}>{t('noRecentVisits')}</div>
          )}
        </div>
      </Stack>
    </MainLayout>
  );
};
