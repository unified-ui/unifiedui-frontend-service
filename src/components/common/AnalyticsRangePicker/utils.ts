import type { AnalyticsPreset, AnalyticsRange } from './AnalyticsRangePicker';

const presetToDays = (preset: AnalyticsPreset): number => {
  if (preset === '7d') return 7;
  if (preset === '30d') return 30;
  if (preset === '90d') return 90;
  return 0;
};

export const buildPresetRange = (preset: AnalyticsPreset): AnalyticsRange => {
  const days = presetToDays(preset);
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - days);
  return {
    from: from.toISOString(),
    to: to.toISOString(),
    preset,
  };
};
