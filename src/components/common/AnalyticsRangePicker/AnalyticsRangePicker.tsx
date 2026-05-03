import type { FC } from 'react';
import { Group, SegmentedControl, Text, TextInput } from '@mantine/core';
import classes from './AnalyticsRangePicker.module.css';

export type AnalyticsPreset = '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsRange {
  from: string;
  to: string;
  preset: AnalyticsPreset;
}

interface AnalyticsRangePickerProps {
  value: AnalyticsRange;
  onChange: (range: AnalyticsRange) => void;
  label?: string;
}

const PRESET_OPTIONS: { label: string; value: AnalyticsPreset }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'Custom', value: 'custom' },
];

export const AnalyticsRangePicker: FC<AnalyticsRangePickerProps> = ({
  value,
  onChange,
  label,
}) => {
  const customFrom = value.preset === 'custom' && value.from ? value.from.slice(0, 10) : '';
  const customTo = value.preset === 'custom' && value.to ? value.to.slice(0, 10) : '';

  const handlePresetChange = (next: string): void => {
    const preset = next as AnalyticsPreset;
    if (preset === 'custom') {
      onChange({ ...value, preset: 'custom' });
      return;
    }
    onChange(buildPresetRange(preset));
  };

  const handleCustomFrom = (v: string): void => {
    onChange({
      preset: 'custom',
      from: v ? new Date(v).toISOString() : '',
      to: value.to,
    });
  };

  const handleCustomTo = (v: string): void => {
    onChange({
      preset: 'custom',
      from: value.from,
      to: v ? new Date(v).toISOString() : '',
    });
  };

  return (
    <Group gap="sm" align="flex-end" wrap="nowrap" className={classes.root}>
      {label && (
        <Text size="sm" c="dimmed" className={classes.label}>
          {label}
        </Text>
      )}
      <SegmentedControl
        size="xs"
        value={value.preset}
        onChange={handlePresetChange}
        data={PRESET_OPTIONS}
      />
      {value.preset === 'custom' && (
        <Group gap="xs" wrap="nowrap">
          <TextInput
            size="xs"
            type="date"
            value={customFrom}
            onChange={(e) => handleCustomFrom(e.currentTarget.value)}
            aria-label="From"
          />
          <TextInput
            size="xs"
            type="date"
            value={customTo}
            onChange={(e) => handleCustomTo(e.currentTarget.value)}
            aria-label="To"
          />
        </Group>
      )}
    </Group>
  );
};
