import type { FC } from 'react';
import { Button, Group } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { YesNoWidgetData } from '../../../../api/types';
import classes from './YesNoWidget.module.css';

interface YesNoWidgetProps {
  data?: YesNoWidgetData;
  onSelect: (value: string) => void;
  disabled?: boolean;
  selectedValue?: string;
}

export const YesNoWidget: FC<YesNoWidgetProps> = ({
  data,
  onSelect,
  disabled = false,
  selectedValue,
}) => {
  const { t } = useTranslation('widgets');
  const yesLabel = data?.yesLabel || t('yesno.yes');
  const noLabel = data?.noLabel || t('yesno.no');

  const isAnswered = !!selectedValue;

  return (
    <Group gap="sm" className={classes.container}>
      <Button
        variant={selectedValue === yesLabel ? 'filled' : 'light'}
        color="primary"
        size="sm"
        disabled={disabled || (isAnswered && selectedValue !== yesLabel)}
        className={classes.button}
        onClick={() => onSelect(yesLabel)}
      >
        {yesLabel}
      </Button>
      <Button
        variant={selectedValue === noLabel ? 'filled' : 'light'}
        color="gray"
        size="sm"
        disabled={disabled || (isAnswered && selectedValue !== noLabel)}
        className={classes.button}
        onClick={() => onSelect(noLabel)}
      >
        {noLabel}
      </Button>
    </Group>
  );
};
