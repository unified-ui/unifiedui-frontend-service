import i18n from '../../i18n/i18nForTests';

describe('i18n Configuration', () => {
  it('initializes with en-US locale', () => {
    expect(i18n.language).toBe('en-US');
  });

  it('has common namespace loaded', () => {
    expect(i18n.t('common:error')).toBe('Error');
    expect(i18n.t('common:success')).toBe('Success');
    expect(i18n.t('common:unexpectedError')).toBe('An unexpected error occurred');
    expect(i18n.t('common:search')).toBe('Search...');
    expect(i18n.t('common:loading')).toBe('Loading...');
  });

  it('has dashboard namespace loaded', () => {
    expect(i18n.t('dashboard:title')).toBe('Dashboard');
    expect(i18n.t('dashboard:welcomeBack', { userName: 'John' })).toBe('Welcome back, John!');
    expect(i18n.t('dashboard:loadingDashboard')).toBe('Loading dashboard...');
    expect(i18n.t('dashboard:tenantSubtitle', { tenantName: 'Acme' })).toBe('Here\'s what\'s happening in "Acme"');
    expect(i18n.t('dashboard:quickStats')).toBe('Quick Stats');
    expect(i18n.t('dashboard:favorites')).toBe('Favorites');
    expect(i18n.t('dashboard:recentlyVisited')).toBe('Recently Visited');
    expect(i18n.t('dashboard:activeCount', { count: 3 })).toBe('3 active');
    expect(i18n.t('dashboard:totalCount', { count: 10 })).toBe('10 total');
    expect(i18n.t('dashboard:noFavorites')).toBe('No favorites yet. Star items to see them here.');
    expect(i18n.t('dashboard:noRecentVisits')).toBe('No recent visits yet. Open items to track them here.');
  });

  it('has login namespace loaded', () => {
    expect(i18n.t('login:heroTitle')).toBe('AI Hub');
    expect(i18n.t('login:heroSubtitle')).toBe('The multi-tenant platform for AI agent integration');
    expect(i18n.t('login:welcome')).toBe('Welcome');
    expect(i18n.t('login:signInWithMicrosoft')).toBe('Sign in with Microsoft');
    expect(i18n.t('login:signOut')).toBe('Sign out');
    expect(i18n.t('login:availableTenants', { count: 3 })).toBe('Available Tenants (3)');
  });

  it('has header namespace loaded', () => {
    expect(i18n.t('header:noTenant')).toBe('No Tenant');
    expect(i18n.t('header:selectTenant')).toBe('Select tenant');
    expect(i18n.t('header:noTenantsAvailable')).toBe('No tenants available');
  });

  it('has tracing namespace loaded', () => {
    expect(i18n.t('tracing:noLogs')).toBe('No logs');
    expect(i18n.t('tracing:noMetadata')).toBe('No metadata');
    expect(i18n.t('tracing:noTracesAvailable')).toBe('No traces available');
    expect(i18n.t('tracing:hideTracing')).toBe('Hide tracing');
    expect(i18n.t('tracing:showTracing')).toBe('Show tracing');
    expect(i18n.t('tracing:noData', { title: 'Input' })).toBe('No Input data');
  });

  it('has credentials namespace loaded', () => {
    expect(i18n.t('credentials:newApiKey')).toBe('New API Key');
    expect(i18n.t('credentials:leaveEmptyToKeep')).toBe('Leave empty to keep current value');
    expect(i18n.t('credentials:fillOnlyToChangeApiKey')).toBe('Only fill in if you want to change the API key');
  });

  it('has token namespace loaded', () => {
    expect(i18n.t('token:loadingIdentity')).toBe('Loading identity data...');
    expect(i18n.t('token:backToDashboard')).toBe('Back to Dashboard');
    expect(i18n.t('token:notAuthenticated')).toBe('Not authenticated');
    expect(i18n.t('token:loggedInAs', { email: 'test@test.com' })).toBe('Logged in as: test@test.com');
  });

  it('has common error handling keys', () => {
    expect(i18n.t('common:errorLoadingChatAgents')).toBe('Failed to load chat agents');
    expect(i18n.t('common:errorLoadingAutonomousAgents')).toBe('Failed to load autonomous agents');
    expect(i18n.t('common:errorLoadingChatWidgets')).toBe('Failed to load chat widgets');
    expect(i18n.t('common:networkError')).toBe('Network error. Check your connection.');
    expect(i18n.t('common:deleteFailed')).toBe('Failed to delete. Please try again.');
  });

  it('falls back to key when translation is missing', () => {
    const result = i18n.t('common:nonExistentKey');
    expect(result).toBe('nonExistentKey');
  });
});
