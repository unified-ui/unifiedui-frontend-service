import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Loader, Stack, Text, Paper, Grid, TextInput, PasswordInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBrain, IconLogout, IconArrowLeft } from '@tabler/icons-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth';
import { enabledProviders } from '../../auth/authConfig';
import type { IdentityProviderType } from '../../auth/authConfig';
import { useIdentity } from '../../contexts';
import { useBranding } from '../../hooks/useBranding';
import { SHOW_PLATFORM_SUBTITLE } from '../../config';
import classes from './LoginPage.module.css';

const MicrosoftIcon = () => (
  <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
    <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
    <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
    <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
  </svg>
);

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const AWSIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.763 10.036c0 .296.032.535.088.71.064.176.144.368.256.576.04.063.056.127.056.183 0 .08-.048.16-.152.24l-.503.335a.383.383 0 0 1-.208.072c-.08 0-.16-.04-.239-.112a2.47 2.47 0 0 1-.287-.374 6.18 6.18 0 0 1-.248-.467c-.622.734-1.405 1.101-2.347 1.101-.67 0-1.205-.191-1.596-.574-.391-.383-.59-.894-.59-1.533 0-.678.239-1.23.726-1.644.487-.415 1.133-.623 1.955-.623.272 0 .551.024.846.064.296.04.6.104.918.176v-.583c0-.607-.127-1.03-.375-1.277-.255-.248-.686-.367-1.3-.367-.28 0-.568.032-.863.104-.296.072-.583.16-.863.272a2.287 2.287 0 0 1-.28.104.488.488 0 0 1-.127.024c-.112 0-.168-.08-.168-.247v-.391c0-.128.016-.224.056-.28a.597.597 0 0 1 .224-.167c.28-.144.614-.264 1.005-.36a4.84 4.84 0 0 1 1.246-.151c.95 0 1.644.216 2.091.647.439.43.662 1.085.662 1.963v2.586z" fill="#FF9900"/>
    <path d="M18.749 14.998c-2.097 1.549-5.136 2.376-7.753 2.376-3.669 0-6.974-1.357-9.474-3.615-.196-.177-.02-.42.215-.282 2.698 1.57 6.036 2.517 9.483 2.517 2.326 0 4.883-.482 7.236-1.48.355-.152.652.233.293.484z" fill="#FF9900"/>
    <path d="M19.618 13.986c-.268-.344-1.77-.162-2.447-.082-.205.024-.237-.154-.052-.284 1.198-.846 3.163-.6 3.393-.318.23.288-.06 2.278-1.186 3.228-.173.146-.338.068-.261-.124.253-.632.821-2.076.553-2.42z" fill="#FF9900"/>
  </svg>
);

const LDAPIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor"/>
  </svg>
);

const KerberosIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor"/>
  </svg>
);

const SAMLIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" fill="currentColor"/>
  </svg>
);

const OktaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z" fill="#007DC1"/>
  </svg>
);

const OIDCIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18l7 3.5v7.64l-7 3.5-7-3.5V7.68l7-3.5z" fill="currentColor"/>
    <circle cx="12" cy="12" r="3" fill="currentColor"/>
  </svg>
);

const PROVIDER_DISPLAY_NAMES: Record<IdentityProviderType, string> = {
  microsoft: 'Microsoft',
  google: 'Google',
  aws_cognito: 'AWS Cognito',
  ldap: 'LDAP',
  kerberos: 'Kerberos',
  saml: 'SAML',
  okta: 'Okta',
  oidc: 'OIDC Zitadel',
};

interface IdpButtonConfig {
  provider: IdentityProviderType;
  icon: () => React.JSX.Element;
  labelKey: string;
}

const IDP_BUTTONS: IdpButtonConfig[] = [
  { provider: 'microsoft', icon: MicrosoftIcon, labelKey: 'continueWithMicrosoft' },
  { provider: 'google', icon: GoogleIcon, labelKey: 'continueWithGoogle' },
  { provider: 'aws_cognito', icon: AWSIcon, labelKey: 'continueWithAWS' },
  { provider: 'ldap', icon: LDAPIcon, labelKey: 'continueWithLDAP' },
  { provider: 'kerberos', icon: KerberosIcon, labelKey: 'continueWithKerberos' },
  { provider: 'saml', icon: SAMLIcon, labelKey: 'continueWithSAML' },
  { provider: 'okta', icon: OktaIcon, labelKey: 'continueWithOkta' },
  { provider: 'oidc', icon: OIDCIcon, labelKey: 'continueWithOIDC' },
];

export const LoginPage = () => {
  const { t } = useTranslation('login');
  const branding = useBranding();
  const { isAuthenticated, loginWithProvider, loginWithCredentials, logout, account, activeProvider } = useAuth();
  const { user, tenants, selectedTenant, isLoading: identityLoading } = useIdentity();
  const [isLoading, setIsLoading] = useState(false);
  const [showLdapForm, setShowLdapForm] = useState(false);
  const [ldapUsername, setLdapUsername] = useState('');
  const [ldapPassword, setLdapPassword] = useState('');
  const [ldapError, setLdapError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Auto-redirect when authenticated
  useEffect(() => {
    if (isAuthenticated && !identityLoading && user) {
      const redirectUrl = searchParams.get('redirect') || '/dashboard';
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, identityLoading, user, navigate, searchParams]);

  const handleProviderLogin = async (provider: IdentityProviderType) => {
    setIsLoading(true);
    try {
      await loginWithProvider(provider);
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

  const handleLdapLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginWithCredentials) return;

    setIsLoading(true);
    setLdapError(null);
    try {
      await loginWithCredentials(ldapUsername, ldapPassword);
    } catch (error) {
      setLdapError(error instanceof Error ? error.message : t('ldapLoginFailed'));
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
            <div className={classes.brandTextWrapper}>
              <span className={classes.brandName} style={{ color: branding.login.textColor }}>
                {branding.displayName}
              </span>
              {SHOW_PLATFORM_SUBTITLE && (
                <span className={classes.brandSubtitle} style={{ color: branding.login.textColor }}>
                  powered by unified-ui
                </span>
              )}
            </div>
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
          <div className={classes.brandTextWrapper}>
            <span className={classes.brandName} style={{ color: branding.login.textColor }}>
              {branding.displayName}
            </span>
            {SHOW_PLATFORM_SUBTITLE && (
              <span className={classes.brandSubtitle} style={{ color: branding.login.textColor }}>
                powered by unified-ui
              </span>
            )}
          </div>
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
            {showLdapForm ? (
              <form onSubmit={handleLdapLogin} autoComplete="off">
                <Stack gap="md">
                  <button
                    type="button"
                    className={classes.authButton}
                    onClick={() => {
                      setShowLdapForm(false);
                      setLdapError(null);
                    }}
                    style={{
                      borderColor: 'transparent',
                      color: branding.login.textColor,
                      justifyContent: 'flex-start',
                      height: 'auto',
                      padding: '0.5rem 0',
                    }}
                  >
                    <IconArrowLeft size={18} />
                    <span>{t('backToProviders')}</span>
                  </button>
                  <TextInput
                    name="ldap-user"
                    label={t('ldapUsername')}
                    placeholder={t('ldapUsernamePlaceholder')}
                    value={ldapUsername}
                    onChange={(e) => setLdapUsername(e.currentTarget.value)}
                    required
                    autoFocus
                    autoComplete="username"
                    styles={{
                      label: { color: branding.login.textColor },
                      input: {
                        borderColor: branding.login.buttonBorderColor,
                        backgroundColor: 'transparent',
                        color: branding.login.textColor,
                      },
                    }}
                  />
                  <PasswordInput
                    name="ldap-pass"
                    label={t('ldapPassword')}
                    placeholder={t('ldapPasswordPlaceholder')}
                    value={ldapPassword}
                    onChange={(e) => setLdapPassword(e.currentTarget.value)}
                    required
                    autoComplete="new-password"
                    styles={{
                      label: { color: branding.login.textColor },
                      input: {
                        borderColor: branding.login.buttonBorderColor,
                        backgroundColor: 'transparent',
                        color: branding.login.textColor,
                      },
                    }}
                  />
                  {ldapError && (
                    <Text size="sm" c="red">
                      {ldapError}
                    </Text>
                  )}
                  <Button
                    type="submit"
                    loading={isLoading}
                    fullWidth
                    size="md"
                    style={{
                      borderColor: branding.login.buttonBorderColor,
                    }}
                  >
                    {t('ldapSignIn')}
                  </Button>
                </Stack>
              </form>
            ) : (
              IDP_BUTTONS
              .filter((btn) => branding.enabledIdps.includes(btn.provider))
              .map((btn) => {
                const isConfigured = enabledProviders.includes(btn.provider);
                const isActive = activeProvider === btn.provider;
                const Icon = btn.icon;

                const handleClick = () => {
                  if (!isConfigured) {
                    notifications.show({
                      title: PROVIDER_DISPLAY_NAMES[btn.provider],
                      message: t('providerNotConfigured', { provider: PROVIDER_DISPLAY_NAMES[btn.provider] }),
                      color: 'orange',
                      autoClose: 4000,
                    });
                    return;
                  }
                  if (btn.provider === 'ldap') {
                    setShowLdapForm(true);
                    return;
                  }
                  handleProviderLogin(btn.provider);
                };

                return (
                  <button
                    key={btn.provider}
                    className={classes.authButton}
                    onClick={handleClick}
                    disabled={isLoading && isActive}
                    style={{
                      borderColor: branding.login.buttonBorderColor,
                      color: branding.login.textColor,
                      ['--hover-bg' as string]: branding.login.buttonHoverBg,
                      opacity: isConfigured ? 1 : 0.5,
                    }}
                  >
                    {isLoading && isActive ? (
                      <Loader size={20} color={branding.login.textColor} />
                    ) : (
                      <Icon />
                    )}
                    <span>{t(btn.labelKey)}</span>
                  </button>
                );
              })
            )}
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
