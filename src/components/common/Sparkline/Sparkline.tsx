import type { FC } from 'react';

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
}

export const Sparkline: FC<SparklineProps> = ({
  data,
  width = 240,
  height = 60,
  color = 'var(--mantine-color-blue-6)',
  fillColor = 'var(--mantine-color-blue-1)',
}) => {
  if (data.length === 0) {
    return (
      <svg width={width} height={height} role="img" aria-label="empty">
        <line x1={0} y1={height / 2} x2={width} y2={height / 2} stroke="var(--mantine-color-gray-4)" strokeDasharray="4 4" />
      </svg>
    );
  }
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : width;
  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const pathLine = `M ${points.join(' L ')}`;
  const pathArea = `${pathLine} L ${(width).toFixed(1)},${height} L 0,${height} Z`;
  return (
    <svg width={width} height={height} role="img" aria-label="sparkline">
      <path d={pathArea} fill={fillColor} opacity={0.5} />
      <path d={pathLine} fill="none" stroke={color} strokeWidth={2} />
    </svg>
  );
};
