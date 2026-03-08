import { useState } from 'react';
import type { FC } from 'react';
import { ActionIcon, Loader } from '@mantine/core';
import { IconSparkles } from '@tabler/icons-react';
import { DelayedTooltip } from '../DelayedTooltip';
import { useIdentity } from '../../../contexts/IdentityContext';
import { useAICapabilities } from '../../../contexts/AICapabilitiesContext';
import classes from './GenerateWithAIButton.module.css';

interface GenerateWithAIButtonProps {
  entityType: string;
  entityName: string;
  existingDescription?: string;
  context?: Record<string, unknown>;
  onGenerated: (description: string) => void;
  disabled?: boolean;
}

export const GenerateWithAIButton: FC<GenerateWithAIButtonProps> = ({
  entityType,
  entityName,
  existingDescription,
  context,
  onGenerated,
  disabled = false,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const { capabilities } = useAICapabilities();
  const [isGenerating, setIsGenerating] = useState(false);

  if (!capabilities?.description_generation) {
    return null;
  }

  const handleGenerate = async () => {
    if (!apiClient || !selectedTenant || !entityName.trim()) return;

    setIsGenerating(true);
    try {
      const result = await apiClient.generateDescription(selectedTenant.id, {
        entity_type: entityType,
        entity_name: entityName,
        existing_description: existingDescription,
        context,
      });
      onGenerated(result.description);
    } catch {
      // Error handled by API client's onError callback
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <DelayedTooltip label="Generate with AI" position="top">
      <ActionIcon
        variant="subtle"
        size="sm"
        onClick={handleGenerate}
        disabled={disabled || isGenerating || !entityName.trim()}
        className={classes.button}
      >
        {isGenerating ? (
          <Loader size={14} />
        ) : (
          <IconSparkles size={14} className={classes.icon} />
        )}
      </ActionIcon>
    </DelayedTooltip>
  );
};
