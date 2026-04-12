import type { FC, KeyboardEvent, DragEvent, ChangeEvent } from 'react';
import { useState, useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  ActionIcon,
  Tooltip,
  Text,
  Paper,
  CloseButton,
} from '@mantine/core';
import {
  IconSend,
  IconPaperclip,
  IconPhoto,
  IconFile,
  IconPlayerStop,
} from '@tabler/icons-react';
import { DelayedTooltip } from '../../common';
import classes from './ChatInput.module.css';

export interface ChatInputProps {
  onSend: (content: string, attachments?: File[]) => void;
  onCancel?: () => void;
  isDisabled?: boolean;
  isStreaming?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export interface ChatInputRef {
  handleFileDrop: (files: File[]) => void;
  focus: () => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  onSend,
  onCancel,
  isDisabled,
  isStreaming,
  placeholder = 'Ask me something... 🚀',
  maxLength = 32000,
}, ref) => {
  const { t } = useTranslation('conversations');
  const [content, setContent] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 200);
      textarea.style.height = `${newHeight}px`;
    }
  }, [content]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSend = useCallback(() => {
    const trimmedContent = content.trim();
    if (!trimmedContent && attachments.length === 0) return;
    if (isDisabled || isStreaming) return;

    onSend(trimmedContent, attachments.length > 0 ? attachments : undefined);
    setContent('');
    setAttachments([]);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  }, [content, attachments, isDisabled, isStreaming, onSend]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleContentChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (newValue.length <= maxLength) {
      setContent(newValue);
    }
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const addFiles = (files: File[]) => {
    const maxAttachments = 5;
    const newAttachments = [...attachments, ...files].slice(0, maxAttachments);
    setAttachments(newAttachments);
  };

  useImperativeHandle(ref, () => ({
    handleFileDrop: (files: File[]) => {
      addFiles(files);
    },
    focus: () => {
      textareaRef.current?.focus();
    },
  }), [attachments]);

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  };

  const canSend = (content.trim().length > 0 || attachments.length > 0) && !isDisabled && !isStreaming;

  return (
    <Box
      className={`${classes.container} ${isDragging ? classes.dragging : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {isDragging && (
        <Box className={classes.dragOverlay}>
          <IconPhoto size={32} />
          <Text size="sm" fw={500}>Drop files here</Text>
        </Box>
      )}

      <Box className={classes.inputOuterWrapper}>
        {attachments.length > 0 && (
          <Box className={classes.attachmentsContainer}>
            {attachments.map((file, index) => (
              <AttachmentPreview
                key={`${file.name}-${index}`}
                file={file}
                onRemove={() => removeAttachment(index)}
              />
            ))}
          </Box>
        )}

        <Box className={classes.inputWrapper}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt,.md"
            onChange={handleFileSelect}
            className={classes.fileInput}
          />

          <Box className={classes.inputContainer}>
            <textarea
              ref={textareaRef}
              className={classes.textarea}
              placeholder={placeholder}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              disabled={isDisabled}
              rows={1}
            />

            {isStreaming ? (
              <Tooltip label="Stop generating">
                <ActionIcon
                  variant="filled"
                  color="red"
                  className={classes.sendButton}
                  onClick={onCancel}
                >
                  <IconPlayerStop size={18} />
                </ActionIcon>
              </Tooltip>
            ) : (
              <Tooltip label="Send message">
                <ActionIcon
                  variant="filled"
                  color="primary"
                  className={classes.sendButton}
                  onClick={handleSend}
                  disabled={!canSend}
                >
                  <IconSend size={18} />
                </ActionIcon>
              </Tooltip>
            )}
          </Box>

          {content.length > maxLength * 0.8 && (
            <Text size="xs" c={content.length >= maxLength ? 'red' : 'dimmed'} className={classes.charCount}>
              {content.length}/{maxLength}
            </Text>
          )}

          <Box className={classes.toolsRow}>
            <button
              type="button"
              className={classes.toolButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={isDisabled || isStreaming}
            >
              <IconPaperclip size={16} />
              <span>Add files</span>
            </button>
          </Box>
        </Box>
      </Box>

      <Text size="xs" c="dimmed" ta="center" className={classes.hint}>
        {t('aiDisclaimer')}
      </Text>
    </Box>
  );
});

ChatInput.displayName = 'ChatInput';

interface AttachmentPreviewProps {
  file: File;
  onRemove: () => void;
}

const AttachmentPreview: FC<AttachmentPreviewProps> = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  const getFileIcon = () => {
    if (isImage) return <IconPhoto size={16} />;
    return <IconFile size={16} />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Paper className={classes.attachmentPreview} shadow="xs">
      {isImage && preview ? (
        <Box className={classes.imagePreview} style={{ backgroundImage: `url(${preview})` }} />
      ) : (
        <Box className={classes.filePreview}>
          {getFileIcon()}
        </Box>
      )}
      <Box className={classes.attachmentInfo}>
        <DelayedTooltip label={file.name}>
          <Text size="xs" lineClamp={1} fw={500}>{file.name}</Text>
        </DelayedTooltip>
        <Text size="xs" c="dimmed">{formatFileSize(file.size)}</Text>
      </Box>
      <CloseButton size="xs" onClick={onRemove} className={classes.removeButton} />
    </Paper>
  );
};
