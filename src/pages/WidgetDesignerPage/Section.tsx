import type { FC } from 'react';
import { useState } from 'react';
import { Text, Group, Badge, Collapse, UnstyledButton, Box } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classes from './WidgetDesignerPage.module.css';

interface SectionProps {
  label: string;
  defaultOpen?: boolean;
  count?: number;
  children: React.ReactNode;
}

export const Section: FC<SectionProps> = ({ label, defaultOpen = true, count, children }) => {
  const [opened, setOpened] = useState(defaultOpen);

  return (
    <Box className={classes.sectionToggle}>
      <UnstyledButton onClick={() => setOpened((o) => !o)} w="100%">
        <Group justify="space-between">
          <Group gap={4}>
            {opened ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
            <Text size="sm" fw={600}>{label}</Text>
          </Group>
          {count !== undefined && count > 0 && <Badge size="xs" variant="light">{count}</Badge>}
        </Group>
      </UnstyledButton>
      <Collapse in={opened} mt="xs">
        {children}
      </Collapse>
    </Box>
  );
};
