import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { Stack, Box, ActionIcon, TextInput, Text } from '@mantine/core';
import { IconTrash } from '@tabler/icons-react';
import classes from './KeyValuePairsInput.module.css';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface KeyValuePairsInputProps {
  label?: string;
  description?: string;
  value: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  maxPairs?: number;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

export const KeyValuePairsInput: FC<KeyValuePairsInputProps> = ({
  label,
  description,
  value,
  onChange,
  maxPairs = 20,
  keyPlaceholder = 'Key',
  valuePlaceholder = 'Value',
}) => {
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const handleChange = useCallback(
    (index: number, field: 'key' | 'value', fieldValue: string) => {
      const updated = [...value];
      updated[index] = { ...updated[index], [field]: fieldValue };
      onChange(updated);
    },
    [value, onChange]
  );

  const handleRemove = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleNewBlur = useCallback(() => {
    const trimmedKey = newKey.trim();
    if (trimmedKey) {
      onChange([...value, { key: trimmedKey, value: newValue.trim() }]);
      setNewKey('');
      setNewValue('');
    }
  }, [newKey, newValue, value, onChange]);

  const handleNewKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const trimmedKey = newKey.trim();
        if (trimmedKey) {
          onChange([...value, { key: trimmedKey, value: newValue.trim() }]);
          setNewKey('');
          setNewValue('');
        }
      }
    },
    [newKey, newValue, value, onChange]
  );

  const showEmptyInput = value.length < maxPairs;

  return (
    <Stack gap="xs">
      {label && (
        <Text size="sm" fw={500}>
          {label}
        </Text>
      )}
      {description && (
        <Text size="xs" c="dimmed">
          {description}
        </Text>
      )}

      {value.map((pair, i) => (
        <Box key={i} className={classes.row}>
          <TextInput
            value={pair.key}
            onChange={(e) => handleChange(i, 'key', e.currentTarget.value)}
            placeholder={keyPlaceholder}
            size="sm"
            className={classes.keyInput}
          />
          <TextInput
            value={pair.value}
            onChange={(e) => handleChange(i, 'value', e.currentTarget.value)}
            placeholder={valuePlaceholder}
            size="sm"
            className={classes.valueInput}
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
            value={newKey}
            onChange={(e) => setNewKey(e.currentTarget.value)}
            onKeyDown={handleNewKeyDown}
            placeholder={keyPlaceholder}
            size="sm"
            className={classes.keyInput}
          />
          <TextInput
            value={newValue}
            onChange={(e) => setNewValue(e.currentTarget.value)}
            onBlur={handleNewBlur}
            onKeyDown={handleNewKeyDown}
            placeholder={valuePlaceholder}
            size="sm"
            className={classes.valueInput}
          />
          <ActionIcon size="sm" variant="subtle" color="gray" style={{ visibility: 'hidden' }}>
            <IconTrash size={14} />
          </ActionIcon>
        </Box>
      )}
    </Stack>
  );
};
