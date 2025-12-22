import type { FC } from 'react';
import { MainLayout } from '../../components/layout/MainLayout';
import classes from './DevelopmentPage.module.css';

export const DevelopmentPage: FC = () => {
  return (
    <MainLayout>
      <div className={classes.container}>
        <iframe 
          src="http://localhost:5678/home/workflows"
          className={classes.iframe}
          title="Development Environment"
        />
      </div>
    </MainLayout>
  );
};
