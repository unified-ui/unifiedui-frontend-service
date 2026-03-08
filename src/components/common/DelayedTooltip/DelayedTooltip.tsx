import type { FC, ReactNode } from 'react';
import { Tooltip } from '@mantine/core';
import type { TooltipProps } from '@mantine/core';

export interface DelayedTooltipProps extends Omit<TooltipProps, 'children'> {
  /** Tooltip content */
  label: ReactNode;
  /** Delay in ms before tooltip opens (default: 1000) */
  openDelay?: number;
  /** Children to wrap */
  children: ReactNode;
}

export const DelayedTooltip: FC<DelayedTooltipProps> = ({
  label,
  openDelay = 1000,
  children,
  ...rest
}) => {
  return (
    <Tooltip
      label={label}
      openDelay={openDelay}
      multiline
      maw={400}
      withArrow
      {...rest}
    >
      {children}
    </Tooltip>
  );
};
