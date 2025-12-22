import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Paper, Stack, CopyButton, ActionIcon, Tooltip, Group, Code, Grid, Loader } from '@mantine/core';
import { IconCopy, IconCheck, IconLogin, IconLogout, IconRobot, IconBrain, IconNetwork, IconShield, IconUsers, IconSparkles } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useIdentity } from '../../contexts';
import classes from './LoginPage.module.css';

export const LoginPage = () => {
  const { isAuthenticated, login, logout, getAccessToken, account } = useAuth();
  const { user, tenants, selectedTenant, isLoading: identityLoading } = useIdentity();
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Redirect to original URL or dashboard if already authenticated AND identity is loaded
  useEffect(() => {
    if (isAuthenticated && !identityLoading && user) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, identityLoading, user, navigate, searchParams]);

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

  // Features für die Landing-Section
  const features = [
    { icon: IconRobot, title: 'Multi-Agent', description: 'Integration verschiedener AI-Agent-Systeme' },
    { icon: IconUsers, title: 'Multi-Tenant', description: 'Strikte Tenant-Isolation mit RBAC' },
    { icon: IconShield, title: 'Sicher', description: 'Enterprise-ready mit Audit-Logging' },
    { icon: IconNetwork, title: 'Skalierbar', description: 'Flexible Infrastruktur-Integration' },
  ];

  return (
    <div className={classes.pageWrapper}>
      {/* Header */}
      <header className={classes.header}>
        <Container fluid px="xl">
          <Group gap="md" justify="flex-start">
            <div className={classes.logoWrapper}>
              <IconBrain size={32} stroke={2} />
            </div>
            <Title order={2} className={classes.headerTitle}>
              unified-ui
            </Title>
          </Group>
        </Container>
      </header>

      {/* Animated Background */}
      <div className={classes.animatedBackground}>
        <div className={classes.gradientOrb1}></div>
        <div className={classes.gradientOrb2}></div>
        <div className={classes.gradientOrb3}></div>
      </div>

      {/* Floating AI Icons */}
      <div className={classes.floatingIcons}>
        <IconBrain className={`${classes.floatingIcon} ${classes.icon1}`} size={40} stroke={1} />
        <IconRobot className={`${classes.floatingIcon} ${classes.icon2}`} size={50} stroke={1} />
        <IconNetwork className={`${classes.floatingIcon} ${classes.icon3}`} size={35} stroke={1} />
        <IconSparkles className={`${classes.floatingIcon} ${classes.icon4}`} size={45} stroke={1} />
        <IconShield className={`${classes.floatingIcon} ${classes.icon5}`} size={38} stroke={1} />
      </div>

      <Container size="lg" className={classes.container}>
        {!isAuthenticated ? (
          <Stack gap="xl" align="center" className={classes.landingContent}>
            {/* Hero Section */}
            <Stack gap="md" align="center" ta="center">
              <Title order={1} className={classes.heroTitle}>
                AI Hub
              </Title>
              <Text size="xl" c="dimmed" className={classes.heroSubtitle}>
                Die Multi-Tenant Plattform für AI-Agent-Integration
              </Text>
              <Text size="md" c="dimmed" className={classes.heroDescription}>
                Verbinde und verwalte verschiedene AI-Agent-Systeme zentral. 
                Mit rollenbasierter Zugriffskontrolle, umfassendem Audit-Logging 
                und Enterprise-ready Sicherheit.
              </Text>
            </Stack>

            {/* Features Grid */}
            <Grid gutter="lg" className={classes.featuresGrid}>
              {features.map((feature, index) => (
                <Grid.Col span={{ base: 12, sm: 6 }} key={index}>
                  <Paper p="lg" radius="md" className={classes.featureCard}>
                    <Group gap="md">
                      <div className={classes.featureIconWrapper}>
                        <feature.icon size={28} stroke={1.5} />
                      </div>
                      <div>
                        <Text fw={600} size="md">{feature.title}</Text>
                        <Text size="sm" c="dimmed">{feature.description}</Text>
                      </div>
                    </Group>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>

            {/* Login Card */}
            <Paper shadow="xl" radius="lg" p="xl" className={classes.loginCard}>
              <Stack gap="lg">
                <Stack gap="xs" ta="center">
                  <Title order={3}>Willkommen</Title>
                  <Text size="sm" c="dimmed">
                    Melde dich an, um auf deine AI-Agents zuzugreifen
                  </Text>
                </Stack>
                <Button
                  leftSection={<IconLogin size={20} />}
                  size="lg"
                  onClick={handleLogin}
                  loading={isLoading}
                  fullWidth
                  variant="gradient"
                  gradient={{ from: 'primary.6', to: 'secondary.6', deg: 45 }}
                >
                  Mit Microsoft anmelden
                </Button>
              </Stack>
            </Paper>
          </Stack>
        ) : (
          <Stack gap="lg" w="100%" className={classes.authenticatedContent}>
            {identityLoading ? (
              <Paper shadow="md" radius="md" p="xl" className={classes.successCard}>
                <Stack gap="md" align="center">
                  <Loader size="lg" />
                  <Text size="md" c="dimmed">
                    Identity-Daten werden geladen...
                  </Text>
                </Stack>
              </Paper>
            ) : (
              <>
                <Paper shadow="md" radius="md" p="xl" className={classes.successCard}>
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <div>
                        <Text size="lg" fw={500} c="green">
                          ✓ Erfolgreich angemeldet
                        </Text>
                        <Text size="sm" c="dimmed">
                          Angemeldet als: {user?.mail || user?.display_name || account?.username || 'Unbekannt'}
                        </Text>
                        {selectedTenant && (
                          <Text size="sm" c="dimmed">
                            Aktueller Tenant: {selectedTenant.name}
                          </Text>
                        )}
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

                    {tenants.length > 0 && (
                      <Stack gap="xs">
                        <Text size="sm" fw={500}>
                          Verfügbare Tenants ({tenants.length}):
                        </Text>
                        <Group gap="xs">
                          {tenants.map((tenant) => (
                            <Paper key={tenant.id} p="xs" withBorder>
                              <Text size="xs" fw={500}>{tenant.name}</Text>
                              <Text size="xs" c="dimmed">
                                {tenant.id ? `${tenant.id.substring(0, 8)}...` : 'Keine ID'}
                              </Text>
                            </Paper>
                          ))}
                        </Group>
                      </Stack>
                    )}
                  </Stack>
                </Paper>
              </>
            )}

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
      </Container>
    </div>
  );
};
