import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { Box, Button, Group, Radio, Text, TextInput, Stack } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import type { SurveyWidgetData } from '../../../../api/types';
import classes from './SurveyWidget.module.css';

interface SurveyWidgetProps {
  data: SurveyWidgetData;
  onSubmit: (answers: Record<string, string>) => void;
  disabled?: boolean;
  submittedAnswers?: Record<string, string>;
}

export const SurveyWidget: FC<SurveyWidgetProps> = ({
  data,
  onSubmit,
  disabled = false,
  submittedAnswers,
}) => {
  const { t } = useTranslation('widgets');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [localSubmittedAnswers, setLocalSubmittedAnswers] = useState<Record<string, string> | null>(null);
  const effectiveSubmitted = submittedAnswers || localSubmittedAnswers;
  const isSubmitted = !!effectiveSubmitted;

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    const initial: Record<number, string> = {};
    data.questions.forEach((q, i) => {
      if (q.recommendation) {
        initial[i] = q.recommendation;
      }
    });
    return initial;
  });
  const [freeText, setFreeText] = useState<Record<number, string>>({});

  const question = data.questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === data.questions.length - 1;

  const handleOptionChange = useCallback((value: string) => {
    setAnswers((prev) => ({ ...prev, [currentIndex]: value }));
    setFreeText((prev) => ({ ...prev, [currentIndex]: '' }));
  }, [currentIndex]);

  const handleFreeTextChange = useCallback((value: string) => {
    setFreeText((prev) => ({ ...prev, [currentIndex]: value }));
  }, [currentIndex]);

  const handleSubmit = useCallback(() => {
    const result: Record<string, string> = {};
    data.questions.forEach((q, i) => {
      const free = freeText[i]?.trim();
      result[q.question] = free || answers[i] || '';
    });
    setLocalSubmittedAnswers(result);
    onSubmit(result);
  }, [data.questions, answers, freeText, onSubmit]);

  if (!question) return null;

  const currentAnswer = (() => {
    if (effectiveSubmitted) {
      const submitted = effectiveSubmitted[question.question] || '';
      return question.options.includes(submitted) ? submitted : '';
    }
    return freeText[currentIndex] ? '' : (answers[currentIndex] || '');
  })();

  const currentFreeText = (() => {
    if (effectiveSubmitted) {
      const submitted = effectiveSubmitted[question.question] || '';
      return question.options.includes(submitted) ? '' : submitted;
    }
    return freeText[currentIndex] || '';
  })();

  return (
    <Box className={classes.container}>
      <Text fw={600} size="sm" className={classes.title}>{data.title}</Text>

      <Box className={classes.questionContainer}>
        <Text size="sm" fw={500} mb="xs">{question.question}</Text>
        <Radio.Group
          value={currentFreeText ? '' : currentAnswer}
          onChange={handleOptionChange}
        >
          <Stack gap="xs">
            {question.options.map((option) => (
              <Radio
                key={option}
                value={option}
                label={option}
                disabled={disabled || isSubmitted}
                size="sm"
              />
            ))}
          </Stack>
        </Radio.Group>

        <TextInput
          mt="sm"
          size="sm"
          placeholder={t('survey.otherAnswer')}
          value={currentFreeText}
          onChange={(e) => handleFreeTextChange(e.currentTarget.value)}
          disabled={disabled || isSubmitted}
          className={classes.freeText}
        />
      </Box>

      <Group justify="space-between" mt="md">
        <Group gap="xs">
          <Button
            size="xs"
            variant="subtle"
            leftSection={<IconChevronLeft size={14} />}
            disabled={isFirst}
            onClick={() => setCurrentIndex((i) => i - 1)}
          >
            {t('survey.previous')}
          </Button>
          <Text size="xs" c="dimmed">
            {t('survey.questionOf', { current: currentIndex + 1, total: data.questions.length })}
          </Text>
          {!isLast && (
            <Button
              size="xs"
              variant="subtle"
              rightSection={<IconChevronRight size={14} />}
              onClick={() => setCurrentIndex((i) => i + 1)}
            >
              {t('survey.next')}
            </Button>
          )}
        </Group>

        {isLast && !disabled && !isSubmitted && (
          <Button size="xs" onClick={handleSubmit}>
            {t('survey.submit')}
          </Button>
        )}
        {isSubmitted && (
          <Text size="xs" c="teal" fw={500}>{t('survey.submitted')}</Text>
        )}
      </Group>
    </Box>
  );
};
