import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Loader, Stack, Text, Paper, Grid } from '@mantine/core';
import { IconBrain, IconLogout } from '@tabler/icons-react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth';
import { useIdentity } from '../../contexts';
import { useBranding } from '../../hooks/useBranding';
import classes from './LoginPage.module.css';

/* ── Microsoft Icon (inline SVG for the login button) ─────── */
const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);

export const LoginPage = () => {
  const { t } = useTranslation('login');
  const branding = useBranding();
  const { isAuthenticated, login, logout, account } = useAuth();
  const { user, tenants, selectedTenant, isLoading: identityLoading } = useIdentity();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  // Auto-redirect when authenticated
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

  const heading = branding.login.heading ?? t('loginHeading', 'Sign in to access the app');

  // ── Authenticated state ────────────────────────────────────
  if (isAuthenticated) {
    return (
      <div className={classes.container}>
        <div
          className={classes.leftPanel}
          style={{
            background: branding.login.bgLeft,
            color: branding.login.textColor,
          }}
        >
          {/* Brand header */}
          <div className={classes.brandHeader}>
            {branding.logoUrl ? (
              <img src={branding.logoUrl} alt={branding.displayName} className={classes.logo} />
            ) : (
              <div className={classes.defaultLogoWrapper}>
                <IconBrain size={24} color="#fff" />
              </div>
            )}
            <span className={classes.brandName} style={{ color: branding.login.textColor }}>
              {branding.displayName}
            </span>
          </div>

          {/* Authenticated content */}
          <div className={classes.loginContent}>
            {identityLoading ? (
              <Stack gap="md" align="center">
                <Loader size="lg" color={branding.login.textColor} />
                <Text size="md" style={{ color: branding.login.textColor, opacity: 0.7 }}>
                  {t('loadingIdentity')}
                </Text>
              </Stack>
            ) : (
              <Paper
                shadow="md"
                radius="md"
                p="xl"
                className={classes.successCard}
                style={{
                  borderColor: branding.login.buttonBorderColor,
                }}
              >
                <Stack gap="md">
                  <div>
                    <Text size="lg" fw={500} c="green">
                      ✓ {t('successfullyLoggedIn')}
                    </Text>
                    <Text size="sm" style={{ color: branding.login.textColor, opacity: 0.7 }}>
                      {t('loggedInAs', {
                        email: user?.mail || user?.display_name || account?.username || 'Unknown',
                      })}
                    </Text>
                    {selectedTenant && (
                      <Text size="sm" style={{ color: branding.login.textColor, opacity: 0.7 }}>
                        {t('currentTenant', { name: selectedTenant.name })}
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
                    {t('signOut')}
                  </Button>

                  {tenants.length > 0 && (
                    <Stack gap="xs">
                      <Text size="sm" fw={500} style={{ color: branding.login.textColor }}>
                        {t('availableTenants', { count: tenants.length })}
                      </Text>
                      <Grid gutter="xs">
                        {tenants.map((tenant) => (
                          <Grid.Col span={{ base: 12, sm: 6 }} key={tenant.id}>
                            <Paper p="xs" className={classes.tenantCard}>
                              <Text size="xs" fw={500}>{tenant.name}</Text>
                              <Text size="xs" style={{ opacity: 0.6 }}>
                                {tenant.id ? `${tenant.id.substring(0, 8)}...` : t('noId')}
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
          </div>
        </div>

        {/* Right panel */}
        <div
          className={classes.rightPanel}
          style={{ background: branding.login.bgRight }}
        >
          <div className={classes.iconWrapper}>
            {branding.iconUrl ? (
              <img src={branding.iconUrl} alt="" className={classes.heroIcon} />
            ) : (
              <img src="/branding/default/icon.svg" alt="" className={classes.heroIcon} />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Unauthenticated state (main login view) ───────────────
  return (
    <div className={classes.container}>
      {/* ═══════ Left Panel ═══════ */}
      <div
        className={classes.leftPanel}
        style={{
          background: branding.login.bgLeft,
          color: branding.login.textColor,
          fontFamily: branding.typography.fontFamily,
        }}
      >
        {/* Brand header — top left */}
        <div className={classes.brandHeader}>
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt={branding.displayName} className={classes.logo} />
          ) : (
            <div className={classes.defaultLogoWrapper}>
              <IconBrain size={24} color="#fff" />
            </div>
          )}
          <span className={classes.brandName} style={{ color: branding.login.textColor }}>
            {branding.displayName}
          </span>
        </div>

        {/* Login content — centered */}
        <div className={classes.loginContent}>
          <h1
            className={classes.heading}
            style={{
              color: branding.login.textColor,
              fontFamily: branding.typography.headingFontFamily || branding.typography.fontFamily,
            }}
          >
            {heading}
          </h1>

          <div className={classes.authButtons}>
            <button
              className={classes.authButton}
              onClick={handleLogin}
              disabled={isLoading}
              style={{
                borderColor: branding.login.buttonBorderColor,
                color: branding.login.textColor,
                ['--hover-bg' as string]: branding.login.buttonHoverBg,
              }}
            >
              {isLoading ? (
                <Loader size={20} color={branding.login.textColor} />
              ) : (
                <MicrosoftIcon />
              )}
              <span>{t('continueWithMicrosoft', 'Continue with Microsoft')}</span>
            </button>

            {/* Future: Google, SAML, etc. */}
            {/* <button className={classes.authButton}>
              <GoogleIcon />
              <span>{t('continueWithGoogle', 'Continue with Google')}</span>
            </button> */}
          </div>
        </div>
      </div>

      {/* ═══════ Right Panel ═══════ */}
      <div
        className={classes.rightPanel}
        style={{ background: branding.login.bgRight }}
      >
        <div className={classes.iconWrapper}>
          {branding.iconUrl ? (
            <img src={branding.iconUrl} alt="" className={classes.heroIcon} />
          ) : (
            <img src="/branding/default/icon.svg" alt="" className={classes.heroIcon} />
          )}
        </div>
      </div>
    </div>
  );
};
