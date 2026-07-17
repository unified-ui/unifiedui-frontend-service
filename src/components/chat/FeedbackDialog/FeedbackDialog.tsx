import type { FC } from 'react';
import { useState } from 'react';
import { Modal, Textarea, Group, Button, Stack, Text, ThemeIcon, Chip } from '@mantine/core';
import { IconThumbDown, IconThumbUp } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

export type FeedbackSentiment = 'positive' | 'negative';

const NEGATIVE_FEEDBACK_REASONS: { value: string; label: string }[] = [
  { value: 'INACCURATE', label: 'inaccurate' },
  { value: 'HALLUCINATION', label: 'hallucination' },
  { value: 'INCOMPLETE', label: 'incomplete' },
  { value: 'FORMATTING', label: 'formatting' },
  { value: 'TOO_SLOW', label: 'too slow' },
  { value: 'INAPPROPRIATE', label: 'inappropriate' },
  { value: 'OTHER', label: 'other' },
];

const POSITIVE_FEEDBACK_REASONS: { value: string; label: string }[] = [
  { value: 'ACCURATE', label: 'accurate' },
  { value: 'HELPFUL', label: 'helpful' },
  { value: 'COMPLETE', label: 'complete' },
  { value: 'WELL_FORMATTED', label: 'well formatted' },
  { value: 'FAST', label: 'fast' },
  { value: 'OTHER', label: 'other' },
];

export interface FeedbackDialogProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (feedbackText?: string, reasons?: string[]) => void;
  sentiment?: FeedbackSentiment;
}

export const FeedbackDialog: FC<FeedbackDialogProps> = ({
  opened,
  onClose,
  onSubmit,
  sentiment = 'negative',
}) => {
  const { t } = useTranslation();
  const [feedbackText, setFeedbackText] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);

  const isPositive = sentiment === 'positive';
  const feedbackReasons = isPositive ? POSITIVE_FEEDBACK_REASONS : NEGATIVE_FEEDBACK_REASONS;
  const accentColor = isPositive ? 'teal' : 'orange';
  const titleKey = isPositive ? 'conversations:feedbackTitlePositive' : 'conversations:feedbackTitle';
  const descriptionKey = isPositive
    ? 'conversations:feedbackDescriptionPositive'
    : 'conversations:feedbackDescription';

  const handleSubmit = () => {
    onSubmit(feedbackText.trim() || undefined, reasons.length > 0 ? reasons : undefined);
    setFeedbackText('');
    setReasons([]);
    onClose();
  };

  const handleClose = () => {
    setFeedbackText('');
    setReasons([]);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="md" color={accentColor} variant="light" radius="xl">
            {isPositive ? <IconThumbUp size={16} /> : <IconThumbDown size={16} />}
          </ThemeIcon>
          <Text fw={600}>{t(titleKey)}</Text>
        </Group>
      }
      size="md"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t(descriptionKey)}
        </Text>
        <Stack gap="xs">
          <Text size="xs" c="dimmed" fw={500} tt="uppercase">Reasons</Text>
          <Chip.Group multiple value={reasons} onChange={setReasons}>
            <Group gap="xs">
              {feedbackReasons.map((reason) => (
                <Chip key={reason.value} value={reason.value} size="sm" variant="light">
                  {reason.label}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Stack>
        <Textarea
          placeholder={t('conversations:feedbackPlaceholder')}
          value={feedbackText}
          onChange={(e) => setFeedbackText(e.currentTarget.value)}
          autosize
          minRows={3}
          maxRows={8}
        />
        <Group justify="flex-end" gap="sm">
          <Button variant="subtle" onClick={handleClose}>
            {t('conversations:cancel')}
          </Button>
          <Button color={accentColor} onClick={handleSubmit}>
            {t('conversations:submitFeedback')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
