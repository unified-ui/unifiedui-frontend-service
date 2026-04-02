import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Title, Text, Stack, Button, Center, ThemeIcon } from '@mantine/core';
import { IconShieldOff, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../../auth';
import classes from './UnauthorizedPage.module.css';

export const UnauthorizedPage: FC = () => {
  const { t } = useTranslation('common');
  const { logout } = useAuth();

  return (
    <Center className={classes.container}>
      <Stack gap="lg" align="center" ta="center" maw={480}>
        <ThemeIcon size={80} radius="xl" variant="light" color="red">
          <IconShieldOff size={40} />
        </ThemeIcon>
        <Title order={2}>{t('unauthorized.title')}</Title>
        <Text c="dimmed" size="lg">
          {t('unauthorized.message')}
        </Text>
        <Button
          leftSection={<IconLogout size={18} />}
          color="red"
          variant="light"
          size="md"
          onClick={() => logout()}
        >
          {t('signOut')}
        </Button>
      </Stack>
    </Center>
  );
};
