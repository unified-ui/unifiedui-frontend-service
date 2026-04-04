import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, FC } from 'react';
import type { UserFavoriteWithNameResponse } from '../api/types';
import { FavoriteResourceTypeEnum } from '../api/types';
import { useIdentity } from './IdentityContext';

type FavoritesMap = Map<FavoriteResourceTypeEnum, Set<string>>;
type FavoriteNamesMap = Map<string, string>;

interface FavoritesContextType {
  favorites: FavoritesMap;
  favoriteNames: FavoriteNamesMap;
  isLoading: boolean;
  isFavorite: (type: FavoriteResourceTypeEnum, id: string) => boolean;
  toggleFavorite: (type: FavoriteResourceTypeEnum, id: string, name?: string) => Promise<void>;
  getFavoriteName: (id: string) => string | undefined;
}

const resourceTypeToEnum: Record<string, FavoriteResourceTypeEnum> = {
  'chat-agents': FavoriteResourceTypeEnum.CHAT_AGENT,
  'workflows': FavoriteResourceTypeEnum.AUTONOMOUS_AGENT,
  'chat-widgets': FavoriteResourceTypeEnum.CHAT_WIDGET,
  'conversations': FavoriteResourceTypeEnum.CONVERSATION,
  'external-apps': FavoriteResourceTypeEnum.EXTERNAL_APP,
};

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: FC<FavoritesProviderProps> = ({ children }) => {
  const { apiClient, user, selectedTenant } = useIdentity();
  const [favorites, setFavorites] = useState<FavoritesMap>(new Map());
  const [favoriteNames, setFavoriteNames] = useState<FavoriteNamesMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!apiClient || !user || !selectedTenant) {
      setFavorites(new Map());
      setFavoriteNames(new Map());
      loadedRef.current = false;
      return;
    }

    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.listAllUserFavorites(selectedTenant.id, user.id);

        const newFavoritesMap: FavoritesMap = new Map();
        const newNamesMap: FavoriteNamesMap = new Map();

        response.favorites.forEach((fav: UserFavoriteWithNameResponse) => {
          const enumType = resourceTypeToEnum[fav.resource_type];
          if (enumType) {
            const ids = newFavoritesMap.get(enumType) ?? new Set<string>();
            ids.add(fav.resource_id);
            newFavoritesMap.set(enumType, ids);
          }
          newNamesMap.set(fav.resource_id, fav.resource_name);
        });

        setFavorites(newFavoritesMap);
        setFavoriteNames(newNamesMap);
      } catch (error) {
        console.error('Failed to load favorites:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, [apiClient, user, selectedTenant]);

  const isFavorite = useCallback(
    (type: FavoriteResourceTypeEnum, id: string): boolean => {
      return favorites.get(type)?.has(id) ?? false;
    },
    [favorites]
  );

  const getFavoriteName = useCallback(
    (id: string): string | undefined => {
      return favoriteNames.get(id);
    },
    [favoriteNames]
  );

  const toggleFavorite = useCallback(
    async (type: FavoriteResourceTypeEnum, id: string, name?: string): Promise<void> => {
      if (!apiClient || !user || !selectedTenant) return;

      const currentlyFavorited = isFavorite(type, id);

      setFavorites(prev => {
        const next = new Map(prev);
        const ids = new Set(next.get(type) ?? []);
        if (currentlyFavorited) {
          ids.delete(id);
        } else {
          ids.add(id);
        }
        next.set(type, ids);
        return next;
      });

      if (!currentlyFavorited && name) {
        setFavoriteNames(prev => {
          const next = new Map(prev);
          next.set(id, name);
          return next;
        });
      }

      try {
        await apiClient.toggleFavorite(selectedTenant.id, user.id, type, id, currentlyFavorited);
      } catch (error) {
        setFavorites(prev => {
          const next = new Map(prev);
          const ids = new Set(next.get(type) ?? []);
          if (currentlyFavorited) {
            ids.add(id);
          } else {
            ids.delete(id);
          }
          next.set(type, ids);
          return next;
        });

        if (!currentlyFavorited && name) {
          setFavoriteNames(prev => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        }
        console.error('Failed to toggle favorite:', error);
      }
    },
    [apiClient, user, selectedTenant, isFavorite]
  );

  const value: FavoritesContextType = {
    favorites,
    favoriteNames,
    isLoading,
    isFavorite,
    toggleFavorite,
    getFavoriteName,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useFavorites = (): FavoritesContextType => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};
