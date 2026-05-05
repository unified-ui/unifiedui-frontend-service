import type { FC, ReactNode } from 'react';
import classes from './KPICard.module.css';

interface KPICardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  color?: string;
  hint?: string;
}

const COLOR_MAP: Record<string, { bg: string; fg: string }> = {
  blue: { bg: 'var(--color-primary-100)', fg: 'var(--color-primary-600)' },
  red: { bg: 'var(--mantine-color-red-1)', fg: 'var(--mantine-color-red-6)' },
  green: { bg: 'var(--color-success-50)', fg: 'var(--color-success-600)' },
  teal: { bg: 'var(--mantine-color-teal-1)', fg: 'var(--mantine-color-teal-6)' },
  violet: { bg: 'var(--color-secondary-100)', fg: 'var(--color-secondary-600)' },
  orange: { bg: 'var(--mantine-color-orange-1)', fg: 'var(--mantine-color-orange-6)' },
};

export const KPICard: FC<KPICardProps> = ({ label, value, icon, color = 'blue', hint }) => {
  const colors = COLOR_MAP[color] ?? COLOR_MAP.blue;
  return (
    <div className={classes.card}>
      {icon && (
        <div className={classes.iconWrapper} style={{ backgroundColor: colors.bg, color: colors.fg }}>
          {icon}
        </div>
      )}
      <div className={classes.body}>
        <div className={classes.valueRow}>
          <span className={classes.value}>{value}</span>
          {hint && <span className={classes.hint}>({hint})</span>}
        </div>
        <span className={classes.label}>{label}</span>
      </div>
    </div>
  );
};
