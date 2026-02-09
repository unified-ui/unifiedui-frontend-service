import type { FileAttachment } from '../api/types';

type FileType = 'image' | 'file' | 'audio';

const MIME_TYPE_NORMALIZATIONS: Record<string, string> = {
  'text/markdown': 'text/plain',
  'text/x-markdown': 'text/plain',
  'application/x-markdown': 'text/plain',
};

export const normalizeMimeType = (mimeType: string, filename: string): string => {
  if (MIME_TYPE_NORMALIZATIONS[mimeType]) {
    return MIME_TYPE_NORMALIZATIONS[mimeType];
  }
  if (!mimeType && filename.endsWith('.md')) {
    return 'text/plain';
  }
  return mimeType;
};

const getFileType = (mimeType: string): FileType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('audio/')) return 'audio';
  return 'file';
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const fileToAttachment = async (file: File): Promise<FileAttachment> => {
  const normalizedMimeType = normalizeMimeType(file.type, file.name);
  const type = getFileType(normalizedMimeType);
  const base64Data = await fileToBase64(file);

  if (type === 'image') {
    return {
      type: 'image',
      imageUrl: `data:${normalizedMimeType};base64,${base64Data}`,
      filename: file.name,
      mimeType: normalizedMimeType,
      detail: 'auto',
    };
  }

  return {
    type,
    fileData: base64Data,
    filename: file.name,
    mimeType: normalizedMimeType,
  };
};

export const filesToAttachments = async (
  files: File[]
): Promise<FileAttachment[]> => {
  return Promise.all(files.map(fileToAttachment));
};
