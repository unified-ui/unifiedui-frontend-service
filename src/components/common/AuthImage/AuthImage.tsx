import type { FC } from 'react';
import { useState, useEffect, useMemo } from 'react';
import { Image, type ImageProps } from '@mantine/core';
import { useIdentity } from '../../../contexts';

interface AuthImageProps extends Omit<ImageProps, 'src'> {
  src?: string | null;
}

interface FetchedImage {
  forSrc: string;
  blobUrl: string;
}

const isDirectUrl = (src: string) =>
  src.startsWith('http://') || src.startsWith('https://') || src.startsWith('data:');

export const AuthImage: FC<AuthImageProps> = ({ src, ...props }) => {
  const { apiClient, selectedTenant } = useIdentity();
  const [fetched, setFetched] = useState<FetchedImage | null>(null);

  const needsFetch = !!src && !!selectedTenant && !isDirectUrl(src);

  useEffect(() => {
    if (!needsFetch) return;

    let cancelled = false;
    let objectUrl: string | undefined;

    const fetchImage = async () => {
      try {
        const downloadUrl = apiClient.getFileDownloadUrl(selectedTenant!.id, src!);
        const token = await apiClient.getAccessTokenForDownload();
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const response = await fetch(downloadUrl, { headers });
        if (!response.ok || cancelled) return;

        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        if (!cancelled) setFetched({ forSrc: src!, blobUrl: objectUrl });
      } catch {
        if (!cancelled) setFetched(null);
      }
    };

    fetchImage();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [needsFetch, src, apiClient, selectedTenant]);

  const resolvedSrc = useMemo(() => {
    if (!src || !selectedTenant) return null;
    if (isDirectUrl(src)) return src;
    return fetched?.forSrc === src ? fetched.blobUrl : null;
  }, [src, selectedTenant, fetched]);

  return <Image src={resolvedSrc} {...props} />;
};
