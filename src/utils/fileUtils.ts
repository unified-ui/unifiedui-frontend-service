import type { FileAttachment } from '../api/types';

type FileType = 'image' | 'file' | 'audio';

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
  const type = getFileType(file.type);
  const base64Data = await fileToBase64(file);

  if (type === 'image') {
    return {
      type: 'image',
      imageUrl: `data:${file.type};base64,${base64Data}`,
      filename: file.name,
      mimeType: file.type,
      detail: 'auto',
    };
  }

  return {
    type,
    fileData: base64Data,
    filename: file.name,
    mimeType: file.type,
  };
};

export const filesToAttachments = async (
  files: File[]
): Promise<FileAttachment[]> => {
  return Promise.all(files.map(fileToAttachment));
};
