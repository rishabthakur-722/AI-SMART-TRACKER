const trimTrailingSlashes = (value: string) => value.replace(/\/+$/, '');
const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();

export const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    return '/api';
  }

  if (!configuredApiUrl) {
    throw new Error('VITE_API_URL is required in production');
  }

  const rawApiUrl = trimTrailingSlashes(configuredApiUrl);
  return rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
};

export const getAuthProviderUrl = (provider: 'google') => {
  return `${getApiBaseUrl()}/auth/${provider}`;
};
