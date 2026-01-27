import { useState, useEffect } from 'react';
import { Container, Title, Text, Button, Paper, Stack, Group, Grid, Loader } from '@mantine/core';
import { IconLogin, IconLogout, IconRobot, IconBrain, IconNetwork, IconShield, IconUsers, IconSparkles } from '@tabler/icons-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useIdentity } from '../../contexts';
import classes from './LoginPage.module.css';

export const LoginPage = () => {
  const { isAuthenticated, login, logout, account } = useAuth();
  const { user, tenants, selectedTenant, isLoading: identityLoading } = useIdentity();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Redirect to original URL or dashboard if already authenticated AND identity is loaded
  // But DON'T redirect if user is on /login/token page
  useEffect(() => {
    if (isAuthenticated && !identityLoading && user && location.pathname === '/login') {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, identityLoading, user, navigate, searchParams, location.pathname]);

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
    } catch (error) {
      console.error('Logout failed:', error);
      setIsLoading(false);
    }
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
              <Paper shadow="md" radius="md" p="xl" className={classes.successCard}>
                <Stack gap="md">
                  <div>
                    <Text size="lg" fw={500} c="green">
                      ✓ Successfully logged in
                    </Text>
                    <Text size="sm" c="dimmed">
                      Logged in as: {user?.mail || user?.display_name || account?.username || 'Unknown'}
                    </Text>
                    {selectedTenant && (
                      <Text size="sm" c="dimmed">
                        Current Tenant: {selectedTenant.name}
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
                    Sign out
                  </Button>

                  {tenants.length > 0 && (
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>
                        Verfügbare Tenants ({tenants.length}):
                      </Text>
                      <Grid gutter="xs">
                        {tenants.map((tenant) => (
                          <Grid.Col span={{ base: 12, sm: 6 }} key={tenant.id}>
                            <Paper p="xs" withBorder>
                              <Text size="xs" fw={500}>{tenant.name}</Text>
                              <Text size="xs" c="dimmed">
                                {tenant.id ? `${tenant.id.substring(0, 8)}...` : 'Keine ID'}
                              </Text>
                            </Paper>
                          </Grid.Col>
                        ))}
                      </Grid>
                    </Stack>
                  )}
                </Stack>
              </Paper>
            )}
          </Stack>
        )}
      </Container>
    </div>
  );
};
