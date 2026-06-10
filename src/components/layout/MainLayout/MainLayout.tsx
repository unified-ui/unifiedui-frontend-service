import type { FC, ReactNode } from 'react';
import { IconBug } from '@tabler/icons-react';
import { useAuth } from '../../../auth';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { GlobalChatSidebar } from '../GlobalChatSidebar';
import classes from './MainLayout.module.css';

interface MainLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export const MainLayout: FC<MainLayoutProps> = ({ children, noPadding = false }) => {
  const { activeProvider, account } = useAuth();
  const isDebugSession = activeProvider === 'debug';

  return (
    <div className={classes.layout}>
      {isDebugSession && (
        <div className={classes.debugBanner}>
          <IconBug size={16} />
          <span>
            DEBUG SESSION — synthetic auth as <strong>{account?.username || 'unknown'}</strong>.
            Never use this configuration in production.
          </span>
        </div>
      )}
      <Header />
      <Sidebar />
      <GlobalChatSidebar />
      <main className={`${classes.content} ${noPadding ? classes.noPadding : ''}`}>
        {children}
      </main>
    </div>
  );
};
