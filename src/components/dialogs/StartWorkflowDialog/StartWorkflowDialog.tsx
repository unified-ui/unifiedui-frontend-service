import { type FC, useCallback, useEffect, useRef, useState } from 'react';
import {
  Modal,
  Button,
  Group,
  Stack,
  Textarea,
  Text,
  ThemeIcon,
  ActionIcon,
  Badge,
} from '@mantine/core';
import { IconPlayerPlay, IconUpload, IconX } from '@tabler/icons-react';
import { useIdentity } from '../../../contexts';
import { KeyValuePairsInput } from '../../common';
import type { KeyValuePair } from '../../common';

interface FileItem {
  name: string;
  mimeType: string;
  data: string;
}

interface StartWorkflowDialogProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  agentId: string;
  defaultBody?: Record<string, unknown>;
  defaultQueryParams?: Record<string, string>;
}

export const StartWorkflowDialog: FC<StartWorkflowDialogProps> = ({
  opened,
  onClose,
  onSuccess,
  agentId,
  defaultBody,
  defaultQueryParams,
}) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [bodyText, setBodyText] = useState('{}');
  const [queryParams, setQueryParams] = useState<KeyValuePair[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (opened) {
      setBodyText(defaultBody ? JSON.stringify(defaultBody, null, 2) : '{}');
      setQueryParams(
        defaultQueryParams
          ? Object.entries(defaultQueryParams).map(([key, value]) => ({ key, value }))
          : []
      );
    }
  }, [opened, defaultBody, defaultQueryParams]);

  const handleBodyKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = bodyText.substring(0, start) + '  ' + bodyText.substring(end);
      setBodyText(newValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      });
    }
  }, [bodyText]);

  const handleClose = () => {
    setBodyText('{}');
    setQueryParams([]);
    setJsonError(null);
    setFiles([]);
    onClose();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const newFiles: FileItem[] = [];
    for (const file of Array.from(selectedFiles)) {
      const buffer = await file.arrayBuffer();
      const base64 = btoa(
        new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      newFiles.push({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: base64,
      });
    }
    setFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStart = async () => {
    if (!apiClient || !selectedTenant) return;

    let parsedBody: Record<string, unknown> | undefined;
    const trimmed = bodyText.trim();
    if (trimmed && trimmed !== '{}') {
      try {
        parsedBody = JSON.parse(trimmed) as Record<string, unknown>;
        setJsonError(null);
      } catch {
        setJsonError('Invalid JSON');
        return;
      }
    }

    const filledPairs = queryParams.filter((p) => p.key.trim());
    let parsedQueryParams: Record<string, string> | undefined;
    if (filledPairs.length > 0) {
      parsedQueryParams = Object.fromEntries(filledPairs.map((p) => [p.key.trim(), p.value]));
    }

    setIsLoading(true);
    try {
      await apiClient.startWorkflow(
        selectedTenant.id,
        agentId,
        parsedBody,
        files.length > 0 ? files : undefined,
        parsedQueryParams
      );
      handleClose();
      onSuccess?.();
    } catch {
      // Error handled by API client onError
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <ThemeIcon color="blue" variant="light" size="lg" radius="xl">
            <IconPlayerPlay size={20} />
          </ThemeIcon>
          <Text fw={600} size="lg">Start Workflow</Text>
        </Group>
      }
      centered
      size="md"
      styles={{
        header: {
          borderBottom: '1px solid var(--border-default)',
          paddingBottom: 'var(--spacing-sm)',
        },
        body: {
          paddingTop: 'var(--spacing-lg)',
        },
      }}
    >
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Trigger the workflow via its configured webhook URL. Optionally provide a JSON body and
          attach files.
        </Text>
        <Textarea
          label="Request Body (JSON)"
          placeholder="{}"
          value={bodyText}
          onChange={(e) => {
            setBodyText(e.currentTarget.value);
            setJsonError(null);
          }}
          onKeyDown={handleBodyKeyDown}
          minRows={5}
          maxRows={12}
          autosize
          styles={{ input: { fontFamily: 'monospace' } }}
          error={jsonError}
        />

        <KeyValuePairsInput
          label="Query Params"
          description="Key-value pairs appended to the webhook URL"
          value={queryParams}
          onChange={setQueryParams}
          keyPlaceholder="Key"
          valuePlaceholder="Value"
        />

        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>Files</Text>
            <Button
              variant="light"
              size="xs"
              leftSection={<IconUpload size={14} />}
              onClick={() => fileInputRef.current?.click()}
            >
              Add Files
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </Group>
          {files.length > 0 && (
            <Stack gap={4}>
              {files.map((file, index) => (
                <Group key={`${file.name}-${index}`} gap="xs" justify="space-between">
                  <Group gap="xs" style={{ overflow: 'hidden', flex: 1 }}>
                    <Badge variant="light" size="sm" style={{ flexShrink: 0 }}>
                      {file.mimeType.split('/').pop()}
                    </Badge>
                    <Text size="sm" truncate style={{ flex: 1 }}>
                      {file.name}
                    </Text>
                  </Group>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => removeFile(index)}
                  >
                    <IconX size={14} />
                  </ActionIcon>
                </Group>
              ))}
            </Stack>
          )}
          {files.length === 0 && (
            <Text size="xs" c="dimmed" ta="center">
              No files attached
            </Text>
          )}
        </Stack>

        <Group justify="flex-end" mt="sm">
          <Button variant="default" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            leftSection={<IconPlayerPlay size={16} />}
            onClick={handleStart}
            loading={isLoading}
          >
            Start
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};
