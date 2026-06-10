const blobUrlCache = new Map<string, string>();

export const getCachedBlobUrl = (fileId: string): string | undefined =>
  blobUrlCache.get(fileId);

export const setCachedBlobUrl = (fileId: string, blobUrl: string): void => {
  blobUrlCache.set(fileId, blobUrl);
};

export const invalidateImageCache = (fileId?: string): void => {
  if (fileId) {
    const cached = blobUrlCache.get(fileId);
    if (cached) {
      URL.revokeObjectURL(cached);
      blobUrlCache.delete(fileId);
    }
  } else {
    blobUrlCache.forEach((url) => URL.revokeObjectURL(url));
    blobUrlCache.clear();
  }
};
