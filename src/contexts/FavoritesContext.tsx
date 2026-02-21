import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode, FC } from 'react';
import { FavoriteResourceTypeEnum } from '../api/types';
import { useIdentity } from './IdentityContext';

type FavoritesMap = Map<FavoriteResourceTypeEnum, Set<string>>;

interface FavoritesContextType {
  favorites: FavoritesMap;
  isLoading: boolean;
  isFavorite: (type: FavoriteResourceTypeEnum, id: string) => boolean;
  toggleFavorite: (type: FavoriteResourceTypeEnum, id: string) => Promise<void>;
}

const RESOURCE_TYPES: FavoriteResourceTypeEnum[] = [
  FavoriteResourceTypeEnum.CHAT_AGENT,
  FavoriteResourceTypeEnum.AUTONOMOUS_AGENT,
  FavoriteResourceTypeEnum.CHAT_WIDGET,
  FavoriteResourceTypeEnum.CONVERSATION,
  FavoriteResourceTypeEnum.RE_ACT_AGENT,
];

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export const FavoritesProvider: FC<FavoritesProviderProps> = ({ children }) => {
  const { apiClient, user, selectedTenant } = useIdentity();
  const [favorites, setFavorites] = useState<FavoritesMap>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!apiClient || !user || !selectedTenant) {
      setFavorites(new Map());
      loadedRef.current = false;
      return;
    }

    if (loadedRef.current) return;
    loadedRef.current = true;

    const loadFavorites = async () => {
      setIsLoading(true);
      try {
        const results = await Promise.all(
          RESOURCE_TYPES.map(type =>
            apiClient.listUserFavorites(selectedTenant.id, user.id, type)
          )
        );

        const newMap: FavoritesMap = new Map();
        RESOURCE_TYPES.forEach((type, index) => {
          const ids = new Set(results[index].favorites.map(f => f.resource_id));
          newMap.set(type, ids);
        });
        setFavorites(newMap);
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

  const toggleFavorite = useCallback(
    async (type: FavoriteResourceTypeEnum, id: string): Promise<void> => {
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
        console.error('Failed to toggle favorite:', error);
      }
    },
    [apiClient, user, selectedTenant, isFavorite]
  );

  const value: FavoritesContextType = {
    favorites,
    isLoading,
    isFavorite,
    toggleFavorite,
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
