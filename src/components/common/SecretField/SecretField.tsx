import type { FC } from 'react';
import { useState, useCallback, useEffect } from 'react';
import { Group, Text, ActionIcon, Tooltip, Loader, Box } from '@mantine/core';
import { IconEye, IconEyeOff, IconCopy, IconCheck, IconRefresh } from '@tabler/icons-react';
import classes from './SecretField.module.css';

interface SecretFieldProps {
  /** Label displayed above the field */
  label: string;
  /** The secret value (null = not yet fetched) */
  value: string | null;
  /** Whether the secret is currently being fetched */
  isLoading?: boolean;
  /** Whether copying is in progress (fetching for copy) */
  isCopying?: boolean;
  /** Callback to fetch/reveal the secret */
  onReveal: () => void;
  /** Callback to copy without revealing - should fetch and copy */
  onCopy?: () => void;
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
  isCopying = false,
  onReveal,
  onCopy,
  onRotate,
  isRotating = false,
  hiddenPlaceholder,
  hiddenLength = 32,
  disabled = false,
  disabledTooltip,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showCopySuccess, setShowCopySuccess] = useState(false);

  useEffect(() => {
    if (value === null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(false);
    }
  }, [value]);

  const handleToggleVisibility = useCallback(() => {
    if (!isVisible) {
      onReveal();
    }
    setIsVisible((prev) => !prev);
  }, [isVisible, onReveal]);

  const handleCopy = useCallback(async () => {
    if (value) {
      navigator.clipboard.writeText(value);
      setShowCopySuccess(true);
      setTimeout(() => setShowCopySuccess(false), 2000);
    } else if (onCopy) {
      onCopy();
    }
  }, [value, onCopy]);

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

          <Tooltip label={showCopySuccess ? 'Copied!' : 'Copy'} position="top">
            <ActionIcon
              variant="subtle"
              color={showCopySuccess ? 'teal' : 'gray'}
              size="sm"
              onClick={handleCopy}
              loading={isCopying}
              disabled={isLoading}
            >
              {showCopySuccess ? <IconCheck size={16} /> : <IconCopy size={16} />}
            </ActionIcon>
          </Tooltip>

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
