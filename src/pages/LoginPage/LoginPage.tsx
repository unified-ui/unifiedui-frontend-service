import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Paper, Stack, CopyButton, ActionIcon, Tooltip, Group, Code } from '@mantine/core';
import { IconCopy, IconCheck, IconLogin, IconLogout } from '@tabler/icons-react';
import { useAuth } from '../../auth';
import classes from './LoginPage.module.css';

export const LoginPage = () => {
  const { isAuthenticated, login, logout, getAccessToken, account } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchToken();
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

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login failed:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      setToken(null);
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoading(false);
    }
  };

  const getTokenPreview = (token: string) => {
    const start = token.slice(0, 40);
    const end = token.slice(-40);
    return `${start}...${end}`;
  };

  return (
    <Container size="sm" className={classes.container}>
      <Stack gap="xl" align="center">
        <Title order={1} className={classes.title}>
          unified-ui
        </Title>

        {!isAuthenticated ? (
          <Paper shadow="md" radius="md" p="xl" className={classes.loginCard}>
            <Stack gap="md">
              <Text size="lg" ta="center" fw={500}>
                Willkommen bei unified-ui
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                Bitte melde dich mit deinem Microsoft-Konto an
              </Text>
              <Button
                leftSection={<IconLogin size={20} />}
                size="lg"
                onClick={handleLogin}
                loading={isLoading}
                fullWidth
              >
                Mit Microsoft anmelden
              </Button>
            </Stack>
          </Paper>
        ) : (
          <Stack gap="lg" w="100%">
            <Paper shadow="md" radius="md" p="xl" className={classes.successCard}>
              <Stack gap="md">
                <Group justify="space-between" align="center">
                  <div>
                    <Text size="lg" fw={500} c="green">
                      ✓ Erfolgreich angemeldet
                    </Text>
                    <Text size="sm" c="dimmed">
                      Angemeldet als: {account?.username || 'Unbekannt'}
                    </Text>
                  </div>
                  <Button
                    leftSection={<IconLogout size={18} />}
                    color="red"
                    variant="light"
                    onClick={handleLogout}
                    loading={isLoading}
                  >
                    Abmelden
                  </Button>
                </Group>
              </Stack>
            </Paper>

            {token && (
              <Paper shadow="md" radius="md" p="xl" className={classes.tokenCard}>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text size="md" fw={500}>
                      Access Token
                    </Text>
                    <CopyButton value={token} timeout={2000}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Kopiert!' : 'Token kopieren'} position="left">
                          <ActionIcon
                            color={copied ? 'teal' : 'gray'}
                            variant="subtle"
                            onClick={copy}
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
                    Klicke auf das Kopier-Symbol, um den vollständigen Token zu kopieren
                  </Text>
                </Stack>
              </Paper>
            )}

            {!token && (
              <Button onClick={fetchToken} loading={isLoading}>
                Token neu laden
              </Button>
            )}
          </Stack>
        )}
      </Stack>
    </Container>
  );
};
