import type { FC } from 'react';
import { Avatar } from '@mantine/core';
import {
  IconSparkles,
  IconRobot,
  IconBrandWechat,
  IconMessages,
  IconFile,
} from '@tabler/icons-react';

export type EntityAvatarType =
  | 'chat-agent'
  | 'autonomous-agent'
  | 'workflow'
  | 'chat-widget'
  | 'conversation';

interface EntityAvatarProps {
  entityType: EntityAvatarType;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const ENTITY_ICONS: Record<EntityAvatarType, typeof IconSparkles> = {
  'chat-agent': IconSparkles,
  'autonomous-agent': IconRobot,
  'workflow': IconRobot,
  'chat-widget': IconBrandWechat,
  'conversation': IconMessages,
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

export const EntityAvatar: FC<EntityAvatarProps> = ({ entityType, size = 'sm' }) => {
  const Icon = ENTITY_ICONS[entityType] || IconFile;
  const avatarSize = SIZE_MAP[size] || 32;
  const iconSize = ICON_SIZE_MAP[size] || 18;

  return (
    <Avatar
      size={avatarSize}
      radius="sm"
      color="gray"
      variant="light"
    >
      <Icon size={iconSize} stroke={1.5} />
    </Avatar>
  );
};
