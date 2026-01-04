import type { FC, ReactNode } from 'react';
import { Header } from '../Header';
import { Sidebar } from '../Sidebar';
import classes from './MainLayout.module.css';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout: FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className={classes.layout}>
      <Header />
      <Sidebar />
      <main className={classes.content}>
        {children}
      </main>
    </div>
  );
};
