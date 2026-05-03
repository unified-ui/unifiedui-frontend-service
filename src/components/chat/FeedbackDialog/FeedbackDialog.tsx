import type { FC } from 'react';
import { useState } from 'react';
import { Modal, Textarea, Group, Button, Stack, Text, ThemeIcon, Chip } from '@mantine/core';
import { IconThumbDown } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const FEEDBACK_REASONS = [
  'inaccurate',
  'irrelevant',
  'unhelpful',
  'too_verbose',
  'too_brief',
  'unsafe',
  'other',
];

export interface FeedbackDialogProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (feedbackText?: string, reasons?: string[]) => void;
}

export const FeedbackDialog: FC<FeedbackDialogProps> = ({
  opened,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [feedbackText, setFeedbackText] = useState('');
  const [reasons, setReasons] = useState<string[]>([]);

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
          <ThemeIcon size="md" color="orange" variant="light" radius="xl">
            <IconThumbDown size={16} />
          </ThemeIcon>
          <Text fw={600}>{t('conversations:feedbackTitle')}</Text>
        </Group>
      }
      size="md"
      centered
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          {t('conversations:feedbackDescription')}
        </Text>
        <Stack gap="xs">
          <Text size="xs" c="dimmed" fw={500} tt="uppercase">Reasons</Text>
          <Chip.Group multiple value={reasons} onChange={setReasons}>
            <Group gap="xs">
              {FEEDBACK_REASONS.map((reason) => (
                <Chip key={reason} value={reason} size="sm" variant="light">
                  {reason.replace(/_/g, ' ')}
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
          <Button color="orange" onClick={handleSubmit}>
            {t('conversations:submitFeedback')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
