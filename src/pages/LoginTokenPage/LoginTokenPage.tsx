import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Text, Button, Paper, Stack, CopyButton, ActionIcon, Tooltip, Group, Code, Loader } from '@mantine/core';
import { IconCopy, IconCheck, IconArrowLeft, IconKey } from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useIdentity } from '../../contexts';
import classes from './LoginTokenPage.module.css';

export const LoginTokenPage = () => {
  const { t } = useTranslation('token');
  const { isAuthenticated, getAccessToken, getFoundryToken, account } = useAuth();
  const { user, selectedTenant, isLoading: identityLoading } = useIdentity();
  const [token, setToken] = useState<string | null>(null);
  const [foundryToken, setFoundryToken] = useState<string | null>(null);
  const [foundryError, setFoundryError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFoundryLoading, setIsFoundryLoading] = useState(false);
  const navigate = useNavigate();

  // NO automatic redirect - just fetch tokens if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      fetchToken();
      fetchFoundryToken();
    }
  }, [isAuthenticated]);

  const fetchToken = async () => {
    setIsLoading(true);
    try {
      const accessToken = await getAccessToken();
      setToken(accessToken);
    } catch (error) {
      console.error('Failed to fetch token:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchFoundryToken = async () => {
    setIsFoundryLoading(true);
    setFoundryError(null);
    try {
      const accessToken = await getFoundryToken();
      setFoundryToken(accessToken);
    } catch (error) {
      console.error('Failed to fetch Foundry token:', error);
      setFoundryError('Consent required. Please allow popups or try again.');
    } finally {
      setIsFoundryLoading(false);
    }
  };

  const getTokenPreview = (token: string) => {
    const start = token.slice(0, 40);
    const end = token.slice(-40);
    return `${start}...${end}`;
  };

  return (
    <div className={classes.pageWrapper}>
      {/* Animated Background */}
      <div className={classes.animatedBackground}>
        <div className={classes.gradientOrb1}></div>
        <div className={classes.gradientOrb2}></div>
        <div className={classes.gradientOrb3}></div>
      </div>

      <Container size="md" className={classes.container}>
        <Stack gap="lg" w="100%">
          {/* Back Button */}
          <Button
            leftSection={<IconArrowLeft size={18} />}
            variant="subtle"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            className={classes.backButton}
          >
            {isAuthenticated ? t('backToDashboard') : t('backToLogin')}
          </Button>

          {/* Show login prompt if not authenticated */}
          {!isAuthenticated && (
            <Paper shadow="md" radius="md" p="xl" className={classes.infoCard}>
              <Stack gap="md" align="center">
                <IconKey size={48} />
                <Text size="lg" fw={600} ta="center">
                  {t('notAuthenticated')}
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {t('mustBeLoggedIn')}
                </Text>
                <Button
                  leftSection={<IconArrowLeft size={18} />}
                  onClick={() => navigate('/login')}
                  fullWidth
                >
                  {t('goToLogin')}
                </Button>
              </Stack>
            </Paper>
          )}

          {/* User Info Card - only show if authenticated */}
          {isAuthenticated && (
            identityLoading ? (
              <Paper shadow="md" radius="md" p="xl" className={classes.infoCard}>
                <Stack gap="md" align="center">
                  <Loader size="lg" />
                  <Text size="md" c="dimmed">
                    {t('loadingIdentity')}
                  </Text>
                </Stack>
              </Paper>
            ) : (
              <Paper shadow="md" radius="md" p="xl" className={classes.infoCard}>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconKey size={20} />
                    <Text size="lg" fw={600}>
                      Access Token
                    </Text>
                  </Group>
                  <Text size="sm" c="dimmed">
                    {t('loggedInAs', { email: user?.mail || user?.display_name || account?.username || t('unknown') })}
                  </Text>
                  {selectedTenant && (
                    <Text size="sm" c="dimmed">
                      {t('currentTenant', { name: selectedTenant.name })}
                    </Text>
                  )}
                </Stack>
              </Paper>
            )
          )}

          {/* Token Card - only show if authenticated */}
          {isAuthenticated && token ? (
            <Paper shadow="md" radius="md" p="xl" className={classes.tokenCard}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="md" fw={500}>
                    Graph API Token
                  </Text>
                  <CopyButton value={token} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? 'Kopiert!' : 'Token kopieren'} position="left">
                        <ActionIcon
                          color={copied ? 'teal' : 'gray'}
                          variant="subtle"
                          onClick={copy}
                          size="lg"
                        >
                          {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <Code block className={classes.tokenDisplay}>
                  {getTokenPreview(token)}
                </Code>
                <Text size="xs" c="dimmed" ta="center">
                  {t('clickCopyIcon')}
                </Text>
                <Button
                  onClick={fetchToken}
                  loading={isLoading}
                  variant="light"
                  fullWidth
                >
                  {t('reloadToken')}
                </Button>
              </Stack>
            </Paper>
          ) : isAuthenticated && !token ? (
            <Paper shadow="md" radius="md" p="xl" className={classes.tokenCard}>
              <Stack gap="md" align="center">
                <Loader size="lg" />
                <Text size="md" c="dimmed">
                  {t('loadingToken')}
                </Text>
                <Button onClick={fetchToken} loading={isLoading}>
                  {t('reloadToken')}
                </Button>
              </Stack>
            </Paper>
          ) : null}

          {/* Foundry Token Card - only show if authenticated */}
          {isAuthenticated && foundryToken ? (
            <Paper shadow="md" radius="md" p="xl" className={classes.tokenCard}>
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="md" fw={500}>
                    {t('foundryTokenTitle')}
                  </Text>
                  <CopyButton value={foundryToken} timeout={2000}>
                    {({ copied, copy }) => (
                      <Tooltip label={copied ? t('copied') : t('copyToken')} position="left">
                        <ActionIcon
                          color={copied ? 'teal' : 'gray'}
                          variant="subtle"
                          onClick={copy}
                          size="lg"
                        >
                          {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                        </ActionIcon>
                      </Tooltip>
                    )}
                  </CopyButton>
                </Group>
                <Code block className={classes.tokenDisplay}>
                  {getTokenPreview(foundryToken)}
                </Code>
                <Text size="xs" c="dimmed" ta="center">
                  {t('clickCopyFoundryIcon')}
                </Text>
                <Button
                  onClick={fetchFoundryToken}
                  loading={isFoundryLoading}
                  variant="light"
                  fullWidth
                >
                  {t('reloadFoundryToken')}
                </Button>
              </Stack>
            </Paper>
          ) : isAuthenticated ? (
            <Paper shadow="md" radius="md" p="xl" className={classes.tokenCard}>
              <Stack gap="md" align="center">
                <IconKey size={32} />
                <Text size="md" fw={500}>
                  {t('foundryTokenTitle')}
                </Text>
                <Text size="sm" c="dimmed" ta="center">
                  {t('fetchFoundryTokenDescription')}
                  {foundryError && <Text c="red" size="xs" mt="xs">{foundryError}</Text>}
                </Text>
                <Button 
                  onClick={fetchFoundryToken} 
                  loading={isFoundryLoading}
                  fullWidth
                >
                  {t('fetchFoundryToken')}
                </Button>
              </Stack>
            </Paper>
          ) : null}
        </Stack>
      </Container>
    </div>
  );
};
