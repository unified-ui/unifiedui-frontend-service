import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Command } from 'cmdk';
import { Badge, Button, Loader } from '@mantine/core';
import {
  IconSparkles,
  IconRobot,
  IconMessages,
  IconSettings,
  IconSquareRoundedPlus,
  IconMoon,
  IconSun,
  IconSearch,
  IconMessageChatbot,
  IconAppWindow,
  IconKey,
  IconTool,
  IconBrain,
  IconUsers,
  IconUsersGroup,
  IconMessage,
  IconExternalLink,
  IconPencil,
  IconX,
} from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { useIdentity } from '../../../contexts';
import { usePermissions } from '../../../hooks/usePermissions';
import type { ResourceType } from '../../../hooks/usePermissions';
import { DelayedTooltip } from '../DelayedTooltip';
import type { SearchResultItem, MessageResponse } from '../../../api/types';
import classes from './CommandPalette.module.css';

const STORAGE_KEY = 'unified-ui-recent-searches';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;
const SEARCH_LIMIT = 10;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ENTITY_ICONS: Record<string, FC<{ size?: number }>> = {
  chat_agent: IconSparkles,
  workflow: IconRobot,
  conversation: IconMessages,
  chat_widget: IconMessageChatbot,
  external_app: IconAppWindow,
  credential: IconKey,
  tool: IconTool,
  tenant_ai_model: IconBrain,
  principal: IconUsers,
  custom_group: IconUsersGroup,
  message: IconMessage,
};

const ENTITY_BADGE_COLORS: Record<string, string> = {
  conversation: 'teal',
  chat_agent: 'violet',
  workflow: 'orange',
  external_app: 'green',
  chat_widget: 'pink',
  credential: 'gray',
  tool: 'gray',
  tenant_ai_model: 'gray',
  principal: 'gray',
  custom_group: 'gray',
  message: 'blue',
};

const SETTINGS_TAB_TYPES: Record<string, string> = {
  credential: 'credentials',
  tool: 'tools',
  tenant_ai_model: 'ai-models',
  principal: 'iam',
  custom_group: 'custom-groups',
};

const DUAL_ACTION_TYPES = new Set(['chat_agent', 'workflow', 'chat_widget']);

const ENTITY_LIST_ROUTES: Record<string, string> = {
  chat_agent: '/chat-agents',
  workflow: '/workflows',
  conversation: '/conversations',
  chat_widget: '/chat-widgets',
  external_app: '/external-apps',
};

interface CommandConfig {
  labelKey: string;
  route: string;
  resourceType: ResourceType;
}

const COMMAND_CONFIGS: CommandConfig[] = [
  { labelKey: 'createChatAgent', route: '/chat-agents?dialog=new', resourceType: 'chat-agents' },
  { labelKey: 'createWorkflow', route: '/workflows?dialog=new', resourceType: 'workflows' },
  { labelKey: 'createChatWidget', route: '/chat-widgets?dialog=new', resourceType: 'chat-widgets' },
  { labelKey: 'createExternalApp', route: '/external-apps?dialog=new', resourceType: 'external-apps' },
  { labelKey: 'createCredential', route: '/tenant-settings?tab=credentials&dialog=new-credential', resourceType: 'credentials' },
  { labelKey: 'createTool', route: '/tenant-settings?tab=tools&dialog=new-tool', resourceType: 'tools' },
  { labelKey: 'createAIModel', route: '/tenant-settings?tab=ai-models&dialog=new-ai-model', resourceType: 'tenant-ai-models' },
  {
    labelKey: 'createCustomGroup',
    route: '/tenant-settings?tab=custom-groups&dialog=new-custom-group',
    resourceType: 'custom-groups',
  },
  { labelKey: 'addPrincipal', route: '/tenant-settings?tab=iam&dialog=add-member', resourceType: 'custom-groups' },
];

const SETTINGS_EDIT_DIALOG_MAP: Record<string, string> = {
  credential: 'edit-credential',
  tool: 'edit-tool',
  tenant_ai_model: 'edit-ai-model',
  principal: 'edit-member',
  custom_group: 'edit-custom-group',
};

const getEntityRoute = (item: SearchResultItem): string => {
  const settingsTab = SETTINGS_TAB_TYPES[item.type];
  if (settingsTab) {
    const editDialog = SETTINGS_EDIT_DIALOG_MAP[item.type];
    return `/tenant-settings?tab=${settingsTab}&selectedId=${item.id}${editDialog ? `&dialog=${editDialog}` : ''}`;
  }
  const baseRoute = ENTITY_LIST_ROUTES[item.type];
  if (!baseRoute) return '/';
  if (item.type === 'chat_agent') {
    return `/conversations?chat-agent=${item.id}&selected=${item.id}`;
  }
  if (item.type === 'chat_widget' && item.sub_type === 'FORM') {
    return `/widget-designer/${item.id}`;
  }
  if (item.type === 'chat_widget') {
    return `${baseRoute}/${item.id}/preview`;
  }
  return `${baseRoute}/${item.id}`;
};

const getEntityEditRoute = (item: SearchResultItem): string | null => {
  if (!DUAL_ACTION_TYPES.has(item.type)) return null;
  const baseRoute = ENTITY_LIST_ROUTES[item.type];
  if (!baseRoute) return null;
  return `${baseRoute}?dialog=edit&selectedId=${item.id}`;
};

const getEntityBadgeLabel = (t: (key: string) => string, item: SearchResultItem): string => {
  const keyMap: Record<string, string> = {
    chat_agent: 'chatAgent',
    workflow: 'workflow',
    chat_widget: 'chatWidget',
    external_app: 'externalApp',
    tenant_ai_model: 'tenantAIModel',
    custom_group: 'customGroup',
  };
  const key = keyMap[item.type] || item.type;
  return t(key) || item.type;
};

interface MergedResult {
  kind: 'entity' | 'message';
  entity?: SearchResultItem;
  message?: MessageResponse;
}

const loadRecentSearches = (): string[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (query: string): void => {
  try {
    const recent = loadRecentSearches().filter(s => s !== query);
    recent.unshift(query);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent.slice(0, MAX_RECENT)));
  } catch {
    // storage unavailable
  }
};

export const CommandPalette: FC<CommandPaletteProps> = ({ open, onOpenChange }) => {
  const { t } = useTranslation('header');
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { apiClient, selectedTenant } = useIdentity();
  const { canCreate } = usePermissions();
  const isDark = colorScheme === 'dark';

  const [query, setQuery] = useState('');
  const [entityResults, setEntityResults] = useState<SearchResultItem[]>([]);
  const [messageResults, setMessageResults] = useState<MessageResponse[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [hasMoreEntities, setHasMoreEntities] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  const mergedResults = useMemo<MergedResult[]>(() => {
    const items: MergedResult[] = entityResults.map(e => ({ kind: 'entity', entity: e }));
    messageResults.forEach(m => items.push({ kind: 'message', message: m }));
    return items;
  }, [entityResults, messageResults]);

  useEffect(() => {
    if (open) {
      setQuery('');
      setEntityResults([]);
      setMessageResults([]);
      setHasMoreEntities(false);
      setRecentSearches(loadRecentSearches());
    }
  }, [open]);

  useEffect(() => {
    if (!open || !apiClient || !selectedTenant) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setEntityResults([]);
      setMessageResults([]);
      setHasMoreEntities(false);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const [entityResponse, messageResponse] = await Promise.all([
          apiClient.globalSearch(selectedTenant.id, {
            q: query.trim(),
            limit: SEARCH_LIMIT,
          }),
          apiClient.searchMessages(selectedTenant.id, {
            query: query.trim(),
            limit: 5,
          }),
        ]);
        setEntityResults(entityResponse.results);
        setHasMoreEntities(entityResponse.results.length >= SEARCH_LIMIT);
        setMessageResults(messageResponse.messages);
      } catch (error) {
        console.error('Search failed:', error);
        setEntityResults([]);
        setMessageResults([]);
      } finally {
        setIsSearching(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, open, apiClient, selectedTenant]);

  const handleLoadMore = useCallback(async () => {
    if (!apiClient || !selectedTenant || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await apiClient.globalSearch(selectedTenant.id, {
        q: query.trim(),
        limit: SEARCH_LIMIT,
        offset: entityResults.length,
      });
      setEntityResults(prev => [...prev, ...response.results]);
      setHasMoreEntities(response.results.length >= SEARCH_LIMIT);
    } catch (error) {
      console.error('Load more failed:', error);
    } finally {
      setIsLoadingMore(false);
    }
  }, [apiClient, selectedTenant, query, entityResults.length, isLoadingMore]);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleSelectResult = useCallback(
    (item: SearchResultItem) => {
      if (query.trim()) saveRecentSearch(query.trim());
      navigate(getEntityRoute(item));
      close();
    },
    [navigate, close, query],
  );

  const handleEditResult = useCallback(
    (item: SearchResultItem) => {
      const editRoute = getEntityEditRoute(item);
      if (!editRoute) return;
      if (query.trim()) saveRecentSearch(query.trim());
      navigate(editRoute);
      close();
    },
    [navigate, close, query],
  );

  const handleSelectMessage = useCallback(
    (msg: MessageResponse) => {
      if (query.trim()) saveRecentSearch(query.trim());
      navigate(`/conversations/${msg.conversationId}`);
      close();
    },
    [navigate, close, query],
  );

  const handleSelectRecent = useCallback((search: string) => {
    setQuery(search);
  }, []);

  const handleNavigate = useCallback(
    (path: string) => {
      navigate(path);
      close();
    },
    [navigate, close],
  );

  const handleToggleColorScheme = useCallback(() => {
    toggleColorScheme();
    close();
  }, [toggleColorScheme, close]);

  const visibleCommands = useMemo(
    () => COMMAND_CONFIGS.filter(cmd => canCreate(cmd.resourceType)),
    [canCreate],
  );

  if (!open) return null;

  const hasQuery = query.trim().length > 0;
  const hasResults = mergedResults.length > 0;

  return (
    <div
      className={classes.overlay}
      onMouseDown={e => { mouseDownTargetRef.current = e.target; }}
      onClick={e => {
        if (mouseDownTargetRef.current === e.target) close();
        mouseDownTargetRef.current = null;
      }}
    >
      <div className={classes.dialog} onClick={e => e.stopPropagation()}>
        <Command
          shouldFilter={false}
          loop
        >
          <div className={classes.inputWrapper}>
            <Command.Input
              autoFocus
              className={classes.input}
              placeholder={t('searchPlaceholder')}
              value={query}
              onValueChange={setQuery}
            />
            {query && (
              <button
                className={classes.inputClear}
                onClick={() => setQuery('')}
                type="button"
              >
                <IconX size={16} />
              </button>
            )}
          </div>
          <Command.List className={classes.list}>
            {isSearching && (
              <div className={classes.loading}>
                <Loader size="sm" />
              </div>
            )}

            {!isSearching && hasQuery && !hasResults && (
              <Command.Empty className={classes.empty}>{t('noResults')}</Command.Empty>
            )}

            {!isSearching && hasQuery && hasResults && (
              <Command.Group heading={t('searchResults')} className={classes.groupHeading}>
                {mergedResults.map(result => {
                  if (result.kind === 'message' && result.message) {
                    const msg = result.message;
                    return (
                      <Command.Item
                        key={`message-${msg.id}`}
                        className={classes.item}
                        onSelect={() => handleSelectMessage(msg)}
                      >
                        <div className={classes.itemIcon}>
                          <IconMessage size={16} />
                        </div>
                        <div className={classes.itemContent}>
                          <DelayedTooltip label={msg.content}>
                            <div className={classes.itemName}>
                              {msg.content.length > 80
                                ? `${msg.content.slice(0, 80)}...`
                                : msg.content}
                            </div>
                          </DelayedTooltip>
                        </div>
                        <Badge size="xs" variant="light" color={ENTITY_BADGE_COLORS.message}>
                          {t('message')}
                        </Badge>
                      </Command.Item>
                    );
                  }

                  if (result.kind === 'entity' && result.entity) {
                    const item = result.entity;
                    const Icon = ENTITY_ICONS[item.type] || IconSearch;
                    const hasDualAction = DUAL_ACTION_TYPES.has(item.type);
                    return (
                      <Command.Item
                        key={`${item.type}-${item.id}`}
                        className={classes.item}
                        onSelect={() => handleSelectResult(item)}
                      >
                        <div className={classes.itemIcon}>
                          <Icon size={16} />
                        </div>
                        <div className={classes.itemContent}>
                          <DelayedTooltip label={item.name}>
                            <div className={classes.itemName}>{item.name}</div>
                          </DelayedTooltip>
                          {item.description && (
                            <DelayedTooltip label={item.description}>
                              <div className={classes.itemDescription}>{item.description}</div>
                            </DelayedTooltip>
                          )}
                        </div>
                        {hasDualAction && (
                          <div className={classes.itemActions}>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              tabIndex={-1}
                              leftSection={<IconExternalLink size={12} />}
                              onClick={e => {
                                e.stopPropagation();
                                handleSelectResult(item);
                              }}
                            >
                              {t('open')}
                            </Button>
                            <Button
                              size="compact-xs"
                              variant="subtle"
                              tabIndex={-1}
                              leftSection={<IconPencil size={12} />}
                              onClick={e => {
                                e.stopPropagation();
                                handleEditResult(item);
                              }}
                            >
                              {t('edit')}
                            </Button>
                          </div>
                        )}
                        <Badge
                          size="xs"
                          variant="light"
                          color={ENTITY_BADGE_COLORS[item.type] || 'gray'}
                        >
                          {getEntityBadgeLabel(t, item)}
                        </Badge>
                      </Command.Item>
                    );
                  }
                  return null;
                })}
                {hasMoreEntities && (
                  <div className={classes.loadMore}>
                    <Button
                      size="compact-sm"
                      variant="subtle"
                      fullWidth
                      loading={isLoadingMore}
                      onClick={handleLoadMore}
                    >
                      {t('loadMore')}
                    </Button>
                  </div>
                )}
              </Command.Group>
            )}

            {!hasQuery && recentSearches.length > 0 && (
              <Command.Group heading={t('recentSearches')} className={classes.groupHeading}>
                {recentSearches.map(search => (
                  <Command.Item
                    key={search}
                    className={classes.item}
                    onSelect={() => handleSelectRecent(search)}
                  >
                    <div className={classes.itemIcon}>
                      <IconSearch size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{search}</div>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {!hasQuery && (
              <Command.Group heading={t('commands')} className={classes.groupHeading}>
                {visibleCommands.map(cmd => (
                  <Command.Item
                    key={cmd.labelKey}
                    className={classes.item}
                    onSelect={() => handleNavigate(cmd.route)}
                  >
                    <div className={classes.itemIcon}>
                      <IconSquareRoundedPlus size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{t(cmd.labelKey)}</div>
                    </div>
                  </Command.Item>
                ))}
                <Command.Item
                  className={classes.item}
                  onSelect={() => handleNavigate('/tenant-settings')}
                >
                  <div className={classes.itemIcon}>
                    <IconSettings size={16} />
                  </div>
                  <div className={classes.itemContent}>
                    <div className={classes.itemName}>{t('openSettings')}</div>
                  </div>
                  <span className={classes.itemShortcut}>⌘,</span>
                </Command.Item>
                <Command.Item className={classes.item} onSelect={handleToggleColorScheme}>
                  <div className={classes.itemIcon}>
                    {isDark ? <IconSun size={16} /> : <IconMoon size={16} />}
                  </div>
                  <div className={classes.itemContent}>
                    <div className={classes.itemName}>
                      {isDark ? t('switchToLight') : t('switchToDark')}
                    </div>
                  </div>
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
