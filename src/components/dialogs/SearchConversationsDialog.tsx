import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Paper,
  Text,
  Group,
  Badge,
  ScrollArea,
  Box,
  UnstyledButton,
  ActionIcon,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { IconSearch, IconMessage, IconX, IconClock } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import type { ConversationResponse, ApplicationResponse } from '../../api/types';
import classes from './SearchConversationsDialog.module.css';

interface SearchConversationsDialogProps {
  opened: boolean;
  onClose: () => void;
  conversations: ConversationResponse[];
  applications: ApplicationResponse[];
}

interface SearchResult {
  conversation: ConversationResponse;
  applicationName: string;
  matchReason: string;
}

export const SearchConversationsDialog: FC<SearchConversationsDialogProps> = ({
  opened,
  onClose,
  conversations,
  applications,
}) => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebouncedValue(searchQuery, 300);

  // Reset search when dialog closes
  useEffect(() => {
    if (!opened) {
      setSearchQuery('');
    }
  }, [opened]);

  // Get application name helper
  const getApplicationName = (applicationId: string): string => {
    const app = applications.find(a => a.id === applicationId);
    return app?.name || 'Unknown Application';
  };

  // Search logic
  const searchResults = useMemo((): SearchResult[] => {
    if (!debouncedQuery.trim()) return [];

    const query = debouncedQuery.toLowerCase();
    const results: SearchResult[] = [];

    conversations.forEach(conv => {
      const matchReasons: string[] = [];

      // Check name
      if (conv.name.toLowerCase().includes(query)) {
        matchReasons.push('name');
      }

      // Check description
      if (conv.description?.toLowerCase().includes(query)) {
        matchReasons.push('description');
      }

      // Check application name
      const appName = getApplicationName(conv.application_id);
      if (appName.toLowerCase().includes(query)) {
        matchReasons.push('application');
      }

      // If any match, add to results
      if (matchReasons.length > 0) {
        results.push({
          conversation: conv,
          applicationName: appName,
          matchReason: matchReasons.join(', '),
        });
      }
    });

    // Sort by most recent update
    results.sort((a, b) =>
      new Date(b.conversation.updated_at).getTime() - new Date(a.conversation.updated_at).getTime()
    );

    return results;
  }, [debouncedQuery, conversations, applications]);

  const handleSelectConversation = (conversationId: string) => {
    navigate(`/conversations/${conversationId}`);
    onClose();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Search Conversations"
      size="lg"
      padding="md"
    >
      <Stack gap="md">
        {/* Search Input */}
        <TextInput
          placeholder="Search by name, description, or application..."
          size="md"
          leftSection={<IconSearch size={20} />}
          rightSection={
            searchQuery && (
              <ActionIcon
                variant="subtle"
                onClick={() => setSearchQuery('')}
                size="sm"
              >
                <IconX size={16} />
              </ActionIcon>
            )
          }
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          autoFocus
        />

        {/* Results */}
        <ScrollArea h={400} type="auto">
          {!debouncedQuery.trim() ? (
            <Box className={classes.emptyState}>
              <IconSearch size={48} className={classes.emptyIcon} />
              <Text size="sm" c="dimmed" mt="md">
                Start typing to search conversations
              </Text>
            </Box>
          ) : searchResults.length === 0 ? (
            <Box className={classes.emptyState}>
              <IconMessage size={48} className={classes.emptyIcon} />
              <Text size="sm" c="dimmed" mt="md">
                No conversations found
              </Text>
              <Text size="xs" c="dimmed">
                Try searching with different keywords
              </Text>
            </Box>
          ) : (
            <Stack gap="xs">
              {searchResults.map((result) => (
                <UnstyledButton
                  key={result.conversation.id}
                  onClick={() => handleSelectConversation(result.conversation.id)}
                  className={classes.resultItem}
                >
                  <Paper p="md" withBorder className={classes.resultPaper}>
                    <Group justify="space-between" wrap="nowrap">
                      <Group gap="md" style={{ flex: 1, minWidth: 0 }}>
                        <IconMessage size={20} className={classes.resultIcon} />
                        <Box style={{ flex: 1, minWidth: 0 }}>
                          <Text size="sm" fw={500} lineClamp={1}>
                            {result.conversation.name}
                          </Text>
                          {result.conversation.description && (
                            <Text size="xs" c="dimmed" lineClamp={1}>
                              {result.conversation.description}
                            </Text>
                          )}
                          <Group gap="xs" mt={4}>
                            <Badge size="xs" variant="light">
                              {result.applicationName}
                            </Badge>
                            <Group gap={4}>
                              <IconClock size={12} />
                              <Text size="xs" c="dimmed">
                                {formatDate(result.conversation.updated_at)}
                              </Text>
                            </Group>
                          </Group>
                        </Box>
                      </Group>
                    </Group>
                  </Paper>
                </UnstyledButton>
              ))}
            </Stack>
          )}
        </ScrollArea>

        {/* Results Count */}
        {debouncedQuery.trim() && (
          <Text size="xs" c="dimmed" ta="center">
            {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
          </Text>
        )}
      </Stack>
    </Modal>
  );
};
