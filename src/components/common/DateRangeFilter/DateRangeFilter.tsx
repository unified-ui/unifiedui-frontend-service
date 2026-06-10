import type { FC } from 'react';
import { Group, SegmentedControl, TextInput } from '@mantine/core';
import {
  computeRangeFromPreset,
  type DateRangePreset,
  type DateRangeValue,
} from './utils';
import classes from './DateRangeFilter.module.css';

interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}

export const DateRangeFilter: FC<DateRangeFilterProps> = ({ value, onChange }) => {
  return (
    <Group gap="md" align="flex-end" wrap="wrap" className={classes.root}>
      <SegmentedControl
        value={value.preset}
        onChange={(v) => onChange(computeRangeFromPreset(v as DateRangePreset, value.from, value.to))}
        data={[
          { label: '7d', value: '7d' },
          { label: '30d', value: '30d' },
          { label: '90d', value: '90d' },
          { label: 'Custom', value: 'custom' },
        ]}
      />
      {value.preset === 'custom' && (
        <>
          <TextInput
            label="From"
            type="date"
            value={value.from}
            onChange={(e) => onChange({ ...value, from: e.currentTarget.value })}
            style={{ width: 180 }}
          />
          <TextInput
            label="To"
            type="date"
            value={value.to}
            onChange={(e) => onChange({ ...value, to: e.currentTarget.value })}
            style={{ width: 180 }}
          />
        </>
      )}
    </Group>
  );
};
