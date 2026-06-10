import {
  IconSparkles,
  IconRobot,
  IconMessages,
  IconMessageChatbot,
  IconAppWindow,
  IconKey,
  IconCpu,
  IconUsersGroup,
  IconUser,
} from '@tabler/icons-react';

export type EntityIconType =
  | 'chat-agent'
  | 'workflow'
  | 'conversation'
  | 'chat-widget'
  | 'external-app'
  | 'credential'
  | 'ai-model'
  | 'custom-group'
  | 'principal';

export const ENTITY_ICONS: Record<EntityIconType, typeof IconSparkles> = {
  'chat-agent': IconSparkles,
  'workflow': IconRobot,
  'conversation': IconMessages,
  'chat-widget': IconMessageChatbot,
  'external-app': IconAppWindow,
  'credential': IconKey,
  'ai-model': IconCpu,
  'custom-group': IconUsersGroup,
  'principal': IconUser,
};

export const ENTITY_ICON_COLORS: Record<EntityIconType, string> = {
  'chat-agent': 'var(--color-primary-500)',
  'workflow': 'var(--color-secondary-500)',
  'conversation': 'var(--color-accent-500)',
  'chat-widget': '#e64980',
  'external-app': '#40c057',
  'credential': '#fd7e14',
  'ai-model': '#4c6ef5',
  'custom-group': '#12b886',
  'principal': '#868e96',
};
