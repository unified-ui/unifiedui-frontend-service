import { useEffect, useRef, useState } from 'react';

interface StreamSmootherConfig {
  charsPerTick?: number;
  minIntervalMs?: number;
  catchUpThreshold?: number;
  catchUpMultiplier?: number;
}

const DEFAULT_CONFIG: Required<StreamSmootherConfig> = {
  charsPerTick: 3,
  minIntervalMs: 12,
  catchUpThreshold: 200,
  catchUpMultiplier: 5,
};

export const useStreamSmoother = (
  rawContent: string,
  isStreaming: boolean,
  config?: StreamSmootherConfig,
): string => {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const [displayContent, setDisplayContent] = useState('');
  const bufferRef = useRef('');
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef(0);
  const displayLengthRef = useRef(0);

  useEffect(() => {
    bufferRef.current = rawContent;
    if (rawContent.length === 0) {
      displayLengthRef.current = 0;
    }
  }, [rawContent]);

  useEffect(() => {
    if (!isStreaming && displayLengthRef.current >= bufferRef.current.length) {
      setDisplayContent(bufferRef.current);
      return;
    }

    const tick = (timestamp: number) => {
      const elapsed = timestamp - lastTimeRef.current;
      if (elapsed >= cfg.minIntervalMs) {
        lastTimeRef.current = timestamp;

        const target = bufferRef.current;
        const currentLen = displayLengthRef.current;

        if (currentLen < target.length) {
          const remaining = target.length - currentLen;
          const chars =
            remaining > cfg.catchUpThreshold
              ? cfg.charsPerTick * cfg.catchUpMultiplier
              : cfg.charsPerTick;

          const newLen = Math.min(currentLen + chars, target.length);
          displayLengthRef.current = newLen;
          setDisplayContent(target.slice(0, newLen));
        } else if (!isStreaming) {
          return;
        }
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    isStreaming,
    cfg.charsPerTick,
    cfg.minIntervalMs,
    cfg.catchUpThreshold,
    cfg.catchUpMultiplier,
  ]);

  return rawContent.length === 0 ? '' : displayContent;
};
