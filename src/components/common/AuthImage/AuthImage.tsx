import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Image, type ImageProps } from '@mantine/core';
import { useIdentity } from '../../../contexts';
import { getCachedBlobUrl, setCachedBlobUrl } from './imageCache';

interface AuthImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
  alt?: string;
  fallbackSrc?: string;
}

interface FetchedImage {
  forSrc: string;
  blobUrl: string;
}

const isDirectUrl = (src: string) =>
  src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:');

export const AuthImage: FC<AuthImageProps> = ({ src, ...props }) => {
  const { apiClient, selectedTenant } = useIdentity();

  const needsFetch = !!src && !!selectedTenant && !isDirectUrl(src);

  const [fetched, setFetched] = useState<FetchedImage | null>(() => {
    if (!needsFetch || !src) return null;
    const cached = getCachedBlobUrl(src);
    return cached ? { forSrc: src, blobUrl: cached } : null;
  });

  useEffect(() => {
    if (!needsFetch || !src) return;

    if (getCachedBlobUrl(src)) return;

    let cancelled = false;

    const fetchImage = async () => {
      try {
        const downloadUrl = apiClient!.getFileDownloadUrl(selectedTenant!.id, src);
        const token = await apiClient!.getAccessTokenForDownload();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(downloadUrl, { headers });
        if (!response.ok || cancelled) return;

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        setCachedBlobUrl(src, objectUrl);
        if (!cancelled) setFetched({ forSrc: src, blobUrl: objectUrl });
      } catch {
        if (!cancelled) setFetched(null);
      }
    };

    fetchImage();
    return () => {
      cancelled = true;
    };
  }, [needsFetch, src, apiClient, selectedTenant]);

  const resolvedSrc = useMemo(() => {
    if (!src || !selectedTenant) return null;
    if (isDirectUrl(src)) return src;
    return fetched?.forSrc === src ? fetched.blobUrl : null;
  }, [src, selectedTenant, fetched]);

  return <Image src={resolvedSrc} {...props} />;
};
