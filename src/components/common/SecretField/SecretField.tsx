import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { Group, Text, ActionIcon, Tooltip, CopyButton, Loader, Box } from '@mantine/core';
import { IconEye, IconEyeOff, IconCopy, IconCheck, IconRefresh } from '@tabler/icons-react';
import classes from './SecretField.module.css';

interface SecretFieldProps {
  /** Label displayed above the field */
  label: string;
  /** The secret value (null = not yet fetched) */
  value: string | null;
  /** Whether the secret is currently being fetched */
  isLoading?: boolean;
  /** Callback to fetch/reveal the secret */
  onReveal: () => void;
  /** Callback when rotate button is clicked */
  onRotate?: () => void;
  /** Whether a rotate operation is in progress */
  isRotating?: boolean;
  /** Placeholder text when secret is hidden */
  hiddenPlaceholder?: string;
  /** Number of dots to show when hidden */
  hiddenLength?: number;
  /** Whether the field is disabled (hides all actions) */
  disabled?: boolean;
  /** Tooltip shown when field is disabled */
  disabledTooltip?: string;
}

export const SecretField: FC<SecretFieldProps> = ({
  label,
  value,
  isLoading = false,
  onReveal,
  onRotate,
  isRotating = false,
  hiddenPlaceholder,
  hiddenLength = 32,
  disabled = false,
  disabledTooltip,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleToggleVisibility = useCallback(() => {
    if (!isVisible && value === null) {
      // First reveal → fetch the secret
      onReveal();
    }
    setIsVisible((prev) => !prev);
  }, [isVisible, value, onReveal]);

  const displayValue = isVisible && value
    ? value
    : hiddenPlaceholder || '•'.repeat(hiddenLength);

  return (
    <div className={classes.container}>
      <Text size="xs" fw={600} tt="uppercase" c="dimmed" className={classes.label}>
        {label}
      </Text>
      <Group gap="xs" wrap="nowrap" className={classes.fieldGroup}>
        <Box className={classes.valueContainer}>
          {isLoading ? (
            <Group gap="xs">
              <Loader size="xs" />
              <Text size="sm" c="dimmed">Loading...</Text>
            </Group>
          ) : (
            <Text
              size="sm"
              ff="monospace"
              className={isVisible && value ? classes.visibleValue : classes.hiddenValue}
            >
              {displayValue}
            </Text>
          )}
        </Box>

        {disabled ? (
          <Tooltip label={disabledTooltip || 'Disabled'} position="top">
            <Text size="xs" c="dimmed" style={{ cursor: 'not-allowed' }}>
              Not available
            </Text>
          </Tooltip>
        ) : (
        <Group gap={4} wrap="nowrap" className={classes.actions}>
          <Tooltip label={isVisible ? 'Hide' : 'Reveal'} position="top">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={handleToggleVisibility}
              disabled={isLoading}
            >
              {isVisible ? <IconEyeOff size={16} /> : <IconEye size={16} />}
            </ActionIcon>
          </Tooltip>

          {value && isVisible && (
            <CopyButton value={value} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy'} position="top">
                  <ActionIcon
                    variant="subtle"
                    color={copied ? 'teal' : 'gray'}
                    size="sm"
                    onClick={copy}
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          )}

          {onRotate && (
            <Tooltip label="Rotate key" position="top">
              <ActionIcon
                variant="subtle"
                color="orange"
                size="sm"
                onClick={onRotate}
                loading={isRotating}
                disabled={isLoading}
              >
                <IconRefresh size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
        )}
      </Group>
    </div>
  );
};
