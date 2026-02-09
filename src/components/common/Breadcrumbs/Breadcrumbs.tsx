import type { FC } from 'react';
import { Breadcrumbs as MantineBreadcrumbs, Anchor, Text } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import classes from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export const Breadcrumbs: FC<BreadcrumbsProps> = ({ items }) => {
  const navigate = useNavigate();

  return (
    <MantineBreadcrumbs
      separator={<IconChevronRight size={14} stroke={1.5} />}
      className={classes.breadcrumbs}
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        if (isLast || !item.path) {
          return (
            <Text key={item.label} size="sm" fw={isLast ? 600 : 400} className={classes.current}>
              {item.label}
            </Text>
          );
        }

        return (
          <Anchor
            key={item.label}
            size="sm"
            className={classes.link}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              if (item.path) {
                navigate(item.path);
              }
            }}
          >
            {item.label}
          </Anchor>
        );
      })}
    </MantineBreadcrumbs>
  );
};
