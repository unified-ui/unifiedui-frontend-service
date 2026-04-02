import type { FC } from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Command } from 'cmdk';
import { Loader } from '@mantine/core';
import {
  IconSparkles,
  IconRobot,
  IconMessages,
  IconSettings,
  IconPlus,
  IconMoon,
  IconSun,
  IconSearch,
  IconHome,
  IconMessageChatbot,
} from '@tabler/icons-react';
import { useMantineColorScheme } from '@mantine/core';
import { useIdentity } from '../../../contexts';
import { DelayedTooltip } from '../DelayedTooltip';
import type { SearchResultItem } from '../../../api/types';
import classes from './CommandPalette.module.css';

const STORAGE_KEY = 'unified-ui-recent-searches';
const MAX_RECENT = 5;
const DEBOUNCE_MS = 300;

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ENTITY_ICONS: Record<string, FC<{ size?: number }>> = {
  chat_agent: IconSparkles,
  autonomous_agent: IconRobot,
  conversation: IconMessages,
};

const ENTITY_ROUTES: Record<string, string> = {
  chat_agent: '/chat-agents',
  autonomous_agent: '/workflows',
  conversation: '/conversations',
};

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
  const { t: tCommon } = useTranslation('common');
  const navigate = useNavigate();
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { apiClient, selectedTenant } = useIdentity();
  const isDark = colorScheme === 'dark';

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setRecentSearches(loadRecentSearches());
    }
  }, [open]);

  useEffect(() => {
    if (!open || !apiClient || !selectedTenant) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await apiClient.globalSearch(selectedTenant.id, {
          q: query.trim(),
          limit: 10,
        });
        setResults(response.results);
      } catch (error) {
        console.error('Search failed:', error);
        setResults([]);
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

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const handleSelectResult = useCallback((item: SearchResultItem) => {
    const route = ENTITY_ROUTES[item.type];
    if (route) {
      if (query.trim()) {
        saveRecentSearch(query.trim());
      }
      navigate(`${route}/${item.id}`);
      close();
    }
  }, [navigate, close, query]);

  const handleSelectRecent = useCallback((search: string) => {
    setQuery(search);
  }, []);

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
    close();
  }, [navigate, close]);

  const handleToggleColorScheme = useCallback(() => {
    toggleColorScheme();
    close();
  }, [toggleColorScheme, close]);

  if (!open) return null;

  const hasQuery = query.trim().length > 0;

  return (
    <div className={classes.overlay} onClick={close}>
      <div className={classes.dialog} onClick={e => e.stopPropagation()}>
        <Command shouldFilter={false}>
          <Command.Input
            autoFocus
            className={classes.input}
            placeholder={t('searchPlaceholder')}
            value={query}
            onValueChange={setQuery}
          />
          <Command.List className={classes.list}>
            {isSearching && (
              <div className={classes.loading}>
                <Loader size="sm" />
              </div>
            )}

            {!isSearching && hasQuery && results.length === 0 && (
              <Command.Empty className={classes.empty}>
                {t('noResults')}
              </Command.Empty>
            )}

            {!isSearching && hasQuery && results.length > 0 && (
              <Command.Group heading={t('searchResults')} className={classes.groupHeading}>
                {results.map(item => {
                  const Icon = ENTITY_ICONS[item.type] || IconSearch;
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
                      <span className={classes.itemBadge}>
                        {tCommon(item.type === 'autonomous_agent' ? 'autonomousAgent' : item.type) || item.type}
                      </span>
                    </Command.Item>
                  );
                })}
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
              <>
                <Command.Group heading={t('commands')} className={classes.groupHeading}>
                  <Command.Item
                    className={classes.item}
                    onSelect={() => handleNavigate('/chat-agents/new')}
                  >
                    <div className={classes.itemIcon}>
                      <IconPlus size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{t('createChatAgent')}</div>
                    </div>
                  </Command.Item>
                  <Command.Item
                    className={classes.item}
                    onSelect={() => handleNavigate('/autonomous-agents/new')}
                  >
                    <div className={classes.itemIcon}>
                      <IconPlus size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{t('createAutonomousAgent')}</div>
                    </div>
                  </Command.Item>
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
                  <Command.Item
                    className={classes.item}
                    onSelect={handleToggleColorScheme}
                  >
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

                <Command.Group heading={t('navigation')} className={classes.groupHeading}>
                  <Command.Item
                    className={classes.item}
                    onSelect={() => handleNavigate('/dashboard')}
                  >
                    <div className={classes.itemIcon}>
                      <IconHome size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{t('goToDashboard')}</div>
                    </div>
                  </Command.Item>
                  <Command.Item
                    className={classes.item}
                    onSelect={() => handleNavigate('/chat-agents')}
                  >
                    <div className={classes.itemIcon}>
                      <IconSparkles size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{tCommon('chatAgents')}</div>
                    </div>
                  </Command.Item>
                  <Command.Item
                    className={classes.item}
                    onSelect={() => handleNavigate('/autonomous-agents')}
                  >
                    <div className={classes.itemIcon}>
                      <IconRobot size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{tCommon('autonomousAgents')}</div>
                    </div>
                  </Command.Item>
                  <Command.Item
                    className={classes.item}
                    onSelect={() => handleNavigate('/conversations')}
                  >
                    <div className={classes.itemIcon}>
                      <IconMessages size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{tCommon('conversations')}</div>
                    </div>
                  </Command.Item>
                  <Command.Item
                    className={classes.item}
                    onSelect={() => handleNavigate('/chat-widgets')}
                  >
                    <div className={classes.itemIcon}>
                      <IconMessageChatbot size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{t('goToChatWidgets')}</div>
                    </div>
                  </Command.Item>
                  <Command.Item
                    className={classes.item}
                    onSelect={() => handleNavigate('/tenant-settings')}
                  >
                    <div className={classes.itemIcon}>
                      <IconSettings size={16} />
                    </div>
                    <div className={classes.itemContent}>
                      <div className={classes.itemName}>{tCommon('settings')}</div>
                    </div>
                  </Command.Item>
                </Command.Group>
              </>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
};
