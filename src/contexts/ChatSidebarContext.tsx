import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode, FC } from 'react';
import { useLocation } from 'react-router-dom';

interface ChatSidebarContextType {
  /** Whether the chat sidebar should be visible (via hover or on conversations page) */
  isVisible: boolean;
  /** Whether currently hovering over the nav item */
  isHovering: boolean;
  /** Call when mouse enters the Conversations nav item */
  onNavItemHoverEnter: () => void;
  /** Call when mouse leaves the Conversations nav item */
  onNavItemHoverLeave: () => void;
  /** Call when mouse enters the ChatSidebar */
  onSidebarHoverEnter: () => void;
  /** Call when mouse leaves the ChatSidebar */
  onSidebarHoverLeave: () => void;
}

const ChatSidebarContext = createContext<ChatSidebarContextType | undefined>(undefined);

interface ChatSidebarProviderProps {
  children: ReactNode;
}

export const ChatSidebarProvider: FC<ChatSidebarProviderProps> = ({ children }) => {
  const location = useLocation();
  const [isHoveringNav, setIsHoveringNav] = useState(false);
  const [isHoveringSidebar, setIsHoveringSidebar] = useState(false);
  
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if we're on the conversations page
  const isOnConversationsPage = location.pathname.startsWith('/conversations');

  // Sidebar is visible if on conversations page OR hovering
  const isVisible = isOnConversationsPage || isHoveringNav || isHoveringSidebar;

  const onNavItemHoverEnter = useCallback(() => {
    // Don't trigger hover if already on conversations page
    if (isOnConversationsPage) return;
    
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    
    // Small delay before showing
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    
    hoverTimeoutRef.current = setTimeout(() => {
      setIsHoveringNav(true);
    }, 150);
  }, [isOnConversationsPage]);

  const onNavItemHoverLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Delay closing to allow moving to sidebar
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringSidebar) {
        setIsHoveringNav(false);
      }
    }, 200);
  }, [isHoveringSidebar]);

  const onSidebarHoverEnter = useCallback(() => {
    setIsHoveringSidebar(true);
    
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  }, []);

  const onSidebarHoverLeave = useCallback(() => {
    setIsHoveringSidebar(false);
    
    closeTimeoutRef.current = setTimeout(() => {
      if (!isHoveringNav) {
        setIsHoveringNav(false);
      }
    }, 200);
  }, [isHoveringNav]);

  return (
    <ChatSidebarContext.Provider
      value={{
        isVisible,
        isHovering: isHoveringNav || isHoveringSidebar,
        onNavItemHoverEnter,
        onNavItemHoverLeave,
        onSidebarHoverEnter,
        onSidebarHoverLeave,
      }}
    >
      {children}
    </ChatSidebarContext.Provider>
  );
};

export const useChatSidebar = (): ChatSidebarContextType => {
  const context = useContext(ChatSidebarContext);
  if (!context) {
    throw new Error('useChatSidebar must be used within a ChatSidebarProvider');
  }
  return context;
};
