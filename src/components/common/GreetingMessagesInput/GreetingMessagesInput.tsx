import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { Stack, Box, ActionIcon, TextInput, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './GreetingMessagesInput.module.css';

export interface GreetingMessagesInputProps {
  value: string[];
  onChange: (messages: string[]) => void;
  maxMessages?: number;
}

export const GreetingMessagesInput: FC<GreetingMessagesInputProps> = ({
  value,
  onChange,
  maxMessages = 6,
}) => {
  const { t } = useTranslation('common');
  const [newMessage, setNewMessage] = useState('');

  const handleChange = useCallback((index: number, newValue: string) => {
    const updated = [...value];
    updated[index] = newValue;
    onChange(updated);
  }, [value, onChange]);

  const handleRemove = useCallback((index: number) => {
    onChange(value.filter((_: string, i: number) => i !== index));
  }, [value, onChange]);

  const handleBlur = useCallback((index: number) => {
    if (index < value.length && value[index].trim() === '') {
      onChange(value.filter((_: string, i: number) => i !== index));
    }
  }, [value, onChange]);

  const handleNewBlur = useCallback(() => {
    const trimmed = newMessage.trim();
    if (trimmed) {
      onChange([...value, trimmed]);
      setNewMessage('');
    }
  }, [newMessage, value, onChange]);

  const handleNewKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = newMessage.trim();
      if (trimmed) {
        onChange([...value, trimmed]);
        setNewMessage('');
      }
    }
  }, [newMessage, value, onChange]);

  const showEmptyInput = value.length < maxMessages;
  const atMax = value.length >= maxMessages;

  return (
    <Stack gap="xs">
      <Text size="sm" fw={500}>{t('greetingMessages.title')}</Text>
      <Text size="xs" c="dimmed">{t('greetingMessages.description')}</Text>

      {value.map((msg: string, i: number) => (
        <Box key={i} className={classes.row}>
          <TextInput
            value={msg}
            onChange={(e) => handleChange(i, e.currentTarget.value)}
            placeholder={t('greetingMessages.placeholder')}
            size="sm"
            className={classes.input}
            onBlur={() => handleBlur(i)}
          />
          <ActionIcon
            size="sm"
            variant="subtle"
            color="red"
            onClick={() => handleRemove(i)}
            className={classes.removeButton}
          >
            <IconTrash size={14} />
          </ActionIcon>
        </Box>
      ))}

      {showEmptyInput && (
        <Box className={classes.row}>
          <TextInput
            value={newMessage}
            onChange={(e) => setNewMessage(e.currentTarget.value)}
            onBlur={handleNewBlur}
            onKeyDown={handleNewKeyDown}
            placeholder={t('greetingMessages.placeholder')}
            size="sm"
            className={classes.input}
          />
        </Box>
      )}

      {atMax && (
        <Text size="xs" c="dimmed">{t('greetingMessages.maxReached')}</Text>
      )}
    </Stack>
  );
};
