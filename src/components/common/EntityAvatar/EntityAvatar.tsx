import type { FC } from 'react';
import { Avatar } from '@mantine/core';

interface EntityAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function getAvatarColor(name: string): string {
  const hue = hashString(name) % 360;
  return `hsl(${hue}, 65%, 45%)`;
}

export const EntityAvatar: FC<EntityAvatarProps> = ({ name, size = 'sm' }) => {
  const initials = getInitials(name);
  const color = getAvatarColor(name);

  return (
    <Avatar
      size={size}
      radius="sm"
      styles={{
        root: { backgroundColor: color },
        placeholder: { color: 'white', fontWeight: 600, fontSize: size === 'xs' ? 10 : undefined },
      }}
    >
      {initials}
    </Avatar>
  );
};
