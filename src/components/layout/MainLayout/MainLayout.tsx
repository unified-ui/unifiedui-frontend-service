import type { FC, ReactNode } from 'react';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import { GlobalChatSidebar } from '../GlobalChatSidebar';
import { NotificationPanel } from '../NotificationPanel';
import classes from './MainLayout.module.css';

interface MainLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

export const MainLayout: FC<MainLayoutProps> = ({ children, noPadding = false }) => {
  return (
    <div className={classes.layout}>
      <Header />
      <Sidebar />
      <GlobalChatSidebar />
      <NotificationPanel />
      <main className={`${classes.content} ${noPadding ? classes.noPadding : ''}`}>
        {children}
      </main>
    </div>
  );
};
