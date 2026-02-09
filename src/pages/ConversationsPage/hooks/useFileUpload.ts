import { useState, useCallback, useRef } from 'react';
import type { ChatInputRef } from '../components/ChatInput';

interface UseFileUploadReturn {
  isDragOver: boolean;
  chatInputRef: React.RefObject<ChatInputRef | null>;
  handleDragEnter: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDragOver: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

/**
 * Hook for managing drag-and-drop file uploads in the chat area.
 */
export function useFileUpload(): UseFileUploadReturn {
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounterRef = useRef(0);
  const chatInputRef = useRef<ChatInputRef>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current = 0;
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && chatInputRef.current) {
      chatInputRef.current.handleFileDrop(files);
    }
  }, []);

  return {
    isDragOver,
    chatInputRef,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  };
}
