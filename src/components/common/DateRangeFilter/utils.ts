export type DateRangePreset = '7d' | '30d' | '90d' | 'custom';

export interface DateRangeValue {
  preset: DateRangePreset;
  from: string;
  to: string;
}

const todayISO = (): string => new Date().toISOString().slice(0, 10);

const daysAgoISO = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

export const computeRangeFromPreset = (
  preset: DateRangePreset,
  from: string,
  to: string
): DateRangeValue => {
  if (preset === '7d') return { preset, from: daysAgoISO(7), to: todayISO() };
  if (preset === '30d') return { preset, from: daysAgoISO(30), to: todayISO() };
  if (preset === '90d') return { preset, from: daysAgoISO(90), to: todayISO() };
  return { preset: 'custom', from, to };
};

export const defaultDateRange = (): DateRangeValue => ({
  preset: '90d',
  from: daysAgoISO(90),
  to: todayISO(),
});
