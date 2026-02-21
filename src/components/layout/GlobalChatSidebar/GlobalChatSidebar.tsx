import type { FC } from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Stack, Text, ScrollArea, Loader, Center, ActionIcon, Group } from '@mantine/core';
import { IconMessages, IconPlus, IconChevronRight } from '@tabler/icons-react';
import { useIdentity, useChatSidebar } from '../../../contexts';
import { DelayedTooltip } from '../../common/DelayedTooltip';
import type { ConversationResponse, ChatAgentResponse } from '../../../api/types';
import classes from './GlobalChatSidebar.module.css';

interface ConversationPreviewItemProps {
  conversation: ConversationResponse;
  chatAgentName: string;
  onClick: () => void;
}

const ConversationPreviewItem: FC<ConversationPreviewItemProps> = ({
  conversation,
  chatAgentName,
  onClick,
}) => {
  return (
    <Box className={classes.conversationItem} onClick={onClick}>
      <DelayedTooltip label={conversation.name}>
        <Text size="sm" lineClamp={1} fw={500}>
          {conversation.name}
        </Text>
      </DelayedTooltip>
      <DelayedTooltip label={chatAgentName}>
        <Text size="xs" c="dimmed" lineClamp={1}>
          {chatAgentName}
        </Text>
      </DelayedTooltip>
    </Box>
  );
};

export const GlobalChatSidebar: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { apiClient, selectedTenant } = useIdentity();
  const { isVisible, onSidebarHoverEnter, onSidebarHoverLeave } = useChatSidebar();
  
  const [conversations, setConversations] = useState<ConversationResponse[]>([]);
  const [chatAgents, setChatAgents] = useState<ChatAgentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Don't render on conversations page - that page has its own sidebar
  const isOnConversationsPage = location.pathname.startsWith('/conversations');

  // Load conversations when becoming visible
  useEffect(() => {
    if (isVisible && !isOnConversationsPage && selectedTenant && apiClient) {
      const loadData = async () => {
        setIsLoading(true);
        try {
          const [convsList, appsList] = await Promise.all([
            apiClient.listConversations(selectedTenant.id) as Promise<ConversationResponse[]>,
            apiClient.listChatAgents(selectedTenant.id) as Promise<ChatAgentResponse[]>,
          ]);
          setConversations(convsList.slice(0, 10)); // Show only recent 10
          setChatAgents(appsList);
        } catch (error) {
          console.error('Failed to load conversations:', error);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }
  }, [isVisible, isOnConversationsPage, selectedTenant, apiClient]);

  // Get chat agent name by ID
  const getChatAgentName = (chatAgentId: string): string => {
    const app = chatAgents.find(a => a.id === chatAgentId);
    return app?.name || 'Unknown Chat Agent';
  };

  // Handle conversation click - navigate to it
  const handleConversationClick = (conversationId: string) => {
    navigate(`/conversations/${conversationId}`);
  };

  // Handle new chat click
  const handleNewChat = () => {
    navigate('/conversations');
  };

  // Don't render on conversations page or when not visible
  if (isOnConversationsPage || !isVisible) {
    return null;
  }

  return (
    <Box 
      className={classes.sidebar}
      onMouseEnter={onSidebarHoverEnter}
      onMouseLeave={onSidebarHoverLeave}
    >
      {/* Header */}
      <Group className={classes.header} justify="space-between">
        <Group gap="xs">
          <IconMessages size={18} />
          <Text size="sm" fw={600}>Conversations</Text>
        </Group>
        <ActionIcon variant="subtle" size="sm" onClick={handleNewChat}>
          <IconPlus size={16} />
        </ActionIcon>
      </Group>

      {/* Content */}
      <ScrollArea className={classes.content}>
        {isLoading ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : conversations.length === 0 ? (
          <Center py="xl">
            <Text size="sm" c="dimmed">No conversations yet</Text>
          </Center>
        ) : (
          <Stack gap={0}>
            {conversations.map(conv => (
              <ConversationPreviewItem
                key={conv.id}
                conversation={conv}
                  chatAgentName={getChatAgentName(conv.chat_agent_id)}
                onClick={() => handleConversationClick(conv.id)}
              />
            ))}
          </Stack>
        )}
      </ScrollArea>

      {/* Footer */}
      <Box 
        className={classes.footer} 
        onClick={() => navigate('/conversations')}
      >
        <Group gap="xs">
          <Text size="xs">View all conversations</Text>
          <IconChevronRight size={14} />
        </Group>
      </Box>
    </Box>
  );
};
