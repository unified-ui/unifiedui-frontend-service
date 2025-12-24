import type { FC, ReactNode } from 'react';
import { Container } from '@mantine/core';
import classes from './PageContainer.module.css';

interface PageContainerProps {
  children: ReactNode;
  /** Maximum width of the container */
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeMap = {
  sm: 800,
  md: 1000,
  lg: 1200,
  xl: 1400,
};

export const PageContainer: FC<PageContainerProps> = ({ 
  children, 
  size = 'lg' 
}) => {
  return (
    <Container 
      size={sizeMap[size]} 
      className={classes.container}
      px="md"
    >
      {children}
    </Container>
  );
};
