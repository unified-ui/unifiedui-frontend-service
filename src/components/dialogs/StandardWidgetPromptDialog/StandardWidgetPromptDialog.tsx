import type { FC } from 'react';
import { Modal, Text, Stack, Group, CopyButton, ActionIcon, Tooltip, Box } from '@mantine/core';
import { IconCopy, IconCheck, IconComponents } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import classes from './StandardWidgetPromptDialog.module.css';

export type StandardWidgetType = 'yesno' | 'survey' | 'custom';

interface StandardWidgetPromptDialogProps {
  opened: boolean;
  onClose: () => void;
  widgetType: StandardWidgetType | null;
  customWidgetId?: string;
  customWidgetName?: string;
}

const WIDGET_EXAMPLES: Record<StandardWidgetType, string> = {
  yesno: '<$_WGET _id=yesno d={"yesLabel":"Yes","noLabel":"No"} />',
  survey: '<$_WGET _id=survey d={"title":"Feedback Survey","questions":[{"question":"How was it?","options":["Good","Neutral","Bad"],"recommendation":"Good"},{"question":"Would you recommend?","options":["Yes","No"]}]} />',
  custom: '<$_WGET _id={widgetId} d={...} />',
};

const WIDGET_PROMPTS: Record<StandardWidgetType, string> = {
  yesno: `When you need to ask the user a yes/no confirmation question (e.g. "May I use tool X?", "Should I proceed?", "Do you want to continue?"), you can render an interactive Yes/No button widget instead of plain text. To do this, include the following tag in your response:

<$_WGET _id=yesno d={"yesLabel":"{yesLabel}","noLabel":"{noLabel}"} />

Replace {yesLabel} and {noLabel} with the appropriate button labels for the context (e.g. "Approve" / "Deny", "Yes" / "No"). The user's choice will be sent back to you as a chat message.`,
  survey: `When you need to ask the user multiple structured questions at once (e.g. collecting feedback, gathering preferences, or making a set of decisions), you can render an interactive survey widget instead of listing questions as plain text. To do this, include the following tag in your response:

<$_WGET _id=survey d={"title":"{surveyTitle}","questions":[{"question":"{questionText}","options":["{option1}","{option2}",...],"recommendation":"{recommendedOption}"},...]} />

Each question must have a "question" text and an "options" array of answer choices. You can optionally include "recommendation" to highlight a preferred answer. The user also has a free-text input field for additional comments — you do not need to account for this in the tag. All answers will be sent back to you as a single chat message.`,
  custom: `Use the custom widget tag to render interactive UI elements in the chat.`,
};

const CopyableBlock: FC<{ label: string; value: string }> = ({ label, value }) => (
  <Box>
    <Text size="sm" fw={500} mb={4}>{label}</Text>
    <div className={classes.codeBlock}>
      <div className={classes.copyButtonWrapper}>
        <CopyButton value={value} timeout={2000}>
          {({ copied, copy }) => (
            <Tooltip label={copied ? 'Copied!' : 'Copy'}>
              <ActionIcon variant="subtle" color={copied ? 'teal' : 'gray'} size="sm" onClick={copy}>
                {copied ? <IconCheck size={14} /> : <IconCopy size={14} />}
              </ActionIcon>
            </Tooltip>
          )}
        </CopyButton>
      </div>
      <div className={classes.codeContent}>{value}</div>
    </div>
  </Box>
);

function getCustomExample(widgetId: string): string {
  return `<$_WGET _id=${widgetId} d={} />`;
}

function getCustomPrompt(widgetId: string, widgetName: string): string {
  return `When you want to trigger the custom widget "${widgetName}", include the following tag in your response:

<$_WGET _id=${widgetId} d={} />

The "d" field can contain any JSON data the widget expects. The widget will be rendered inline in the chat and the user's response will be sent back to you as a chat message.`;
}

export const StandardWidgetPromptDialog: FC<StandardWidgetPromptDialogProps> = ({
  opened,
  onClose,
  widgetType,
  customWidgetId,
  customWidgetName,
}) => {
  const { t } = useTranslation('widgets');

  if (!widgetType) return null;

  const isCustom = widgetType === 'custom';
  const titleKey = isCustom ? 'widgetInfo.customTitle' : widgetType === 'yesno' ? 'widgetInfo.yesnoTitle' : 'widgetInfo.surveyTitle';
  const descKey = isCustom ? 'widgetInfo.customDescription' : widgetType === 'yesno' ? 'widgetInfo.yesnoDescription' : 'widgetInfo.surveyDescription';
  const title = isCustom && customWidgetName ? customWidgetName : t(titleKey);

  const example = isCustom && customWidgetId ? getCustomExample(customWidgetId) : WIDGET_EXAMPLES[widgetType as 'yesno' | 'survey'];
  const prompt = isCustom && customWidgetId && customWidgetName ? getCustomPrompt(customWidgetId, customWidgetName) : WIDGET_PROMPTS[widgetType as 'yesno' | 'survey'];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title={
        <Group gap="xs">
          <IconComponents size={20} />
          <Text fw={600}>{title}</Text>
        </Group>
      }
      size="lg"
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">{t(descKey)}</Text>

        <CopyableBlock
          label={t('standardWidgetDialog.exampleLabel')}
          value={example}
        />

        <CopyableBlock
          label={t('standardWidgetDialog.promptLabel')}
          value={prompt}
        />
      </Stack>
    </Modal>
  );
};
