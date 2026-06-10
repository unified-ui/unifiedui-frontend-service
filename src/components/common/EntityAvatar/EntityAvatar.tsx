import type { FC } from 'react';
import { Avatar } from '@mantine/core';
import {
  IconSparkles,
  IconRobot,
  IconBrandWechat,
  IconMessages,
  IconFile,
  IconAppWindow,
} from '@tabler/icons-react';

export type EntityAvatarType =
  | 'chat-agent'
  | 'workflow'
  | 'workflow'
  | 'chat-widget'
  | 'conversation'
  | 'external-app';

interface EntityAvatarProps {
  entityType: EntityAvatarType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  colored?: boolean;
}

const ENTITY_ICONS: Record<EntityAvatarType, typeof IconSparkles> = {
  'chat-agent': IconSparkles,
  'workflow': IconRobot,
  'chat-widget': IconBrandWechat,
  'conversation': IconMessages,
  'external-app': IconAppWindow,
};

const ENTITY_COLORS: Record<EntityAvatarType, { bg: string; fg: string }> = {
  'chat-agent': { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-600)' },
  'workflow': { bg: 'var(--color-secondary-100)', fg: 'var(--color-secondary-600)' },
  'chat-widget': { bg: 'var(--mantine-color-orange-1)', fg: 'var(--mantine-color-orange-6)' },
  'conversation': { bg: 'var(--color-accent-100)', fg: 'var(--color-accent-600)' },
  'external-app': { bg: 'var(--mantine-color-pink-1)', fg: 'var(--mantine-color-pink-6)' },
};

const SIZE_MAP: Record<string, number> = {
  xs: 24,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
};

const ICON_SIZE_MAP: Record<string, number> = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
};

export const EntityAvatar: FC<EntityAvatarProps> = ({ entityType, size = 'sm', colored = false }) => {
  const Icon = ENTITY_ICONS[entityType] || IconFile;
  const avatarSize = SIZE_MAP[size] || 32;
  const iconSize = ICON_SIZE_MAP[size] || 18;
  const colors = colored ? ENTITY_COLORS[entityType] : undefined;

  return (
    <Avatar
      size={avatarSize}
      radius="sm"
      color={colors ? undefined : 'gray'}
      variant={colors ? 'transparent' : 'light'}
      style={colors ? {
        backgroundColor: colors.bg,
        color: colors.fg,
      } : undefined}
    >
      <Icon size={iconSize} stroke={1.5} />
    </Avatar>
  );
};
