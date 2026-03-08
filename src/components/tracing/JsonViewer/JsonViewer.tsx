import { useState } from 'react';
import type { FC } from 'react';
import { Text, Code, Collapse, UnstyledButton } from '@mantine/core';
import { IconChevronDown, IconChevronRight } from '@tabler/icons-react';
import classes from './JsonViewer.module.css';

interface JsonViewerProps {
  data: unknown;
  initialCollapsed?: boolean;
  maxHeight?: number;
}

export const JsonViewer: FC<JsonViewerProps> = ({ data, initialCollapsed = true, maxHeight }) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  if (data === null || data === undefined) {
    return <Text size="xs" c="dimmed" fs="italic">null</Text>;
  }

  if (typeof data !== 'object') {
    const style = maxHeight ? { maxHeight, overflowY: 'auto' as const } : undefined;
    return (
      <Code block className={classes.codeBlock} style={style}>
        {String(data)}
      </Code>
    );
  }

  const jsonString = JSON.stringify(data, null, 2);
  const lineCount = jsonString.split('\n').length;
  const isLarge = lineCount > 5;
  const style = maxHeight ? { maxHeight, overflowY: 'auto' as const } : undefined;

  if (!isLarge) {
    return (
      <Code block className={classes.codeBlock} style={style}>
        {jsonString}
      </Code>
    );
  }

  return (
    <div className={classes.container}>
      <UnstyledButton
        className={classes.toggle}
        onClick={() => setCollapsed(!collapsed)}
      >
        {collapsed ? <IconChevronRight size={14} /> : <IconChevronDown size={14} />}
        <Text size="xs" c="dimmed">{lineCount} lines</Text>
      </UnstyledButton>
      <Collapse in={!collapsed}>
        <Code block className={classes.codeBlock} style={style}>
          {jsonString}
        </Code>
      </Collapse>
      {collapsed && (
        <Code block className={classes.codeBlockPreview}>
          {jsonString.split('\n').slice(0, 3).join('\n')}...
        </Code>
      )}
    </div>
  );
};
