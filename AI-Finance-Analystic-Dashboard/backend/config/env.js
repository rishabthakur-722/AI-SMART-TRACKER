const appName = 'StockIQ';
const localMongoUri = 'mongodb://127.0.0.1:27017/stockiq';
const requiredInProduction = ['JWT_SECRET', 'CLIENT_URL', 'SESSION_SECRET'];
const liveProviderKeys = ['FINNHUB_API_KEY', 'FMP_API_KEY', 'GROQ_API_KEY', 'GEMINI_API_KEY', 'COINGECKO_API_KEY'];
const isProduction = process.env.NODE_ENV === 'production';
const isLocalhostUrl = (value) => /^https?:\/\/(localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(value.trim());

const readEnv = (key, fallback = '') => String(process.env[key] || fallback).trim();
const readBoolean = (key, fallback = false) => {
  const value = readEnv(key);

  if (!value) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
};

const readPositiveInteger = (key, fallback) => {
  const value = Number(process.env[key]);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : fallback;
};

const validateEnv = () => {
  if (!isProduction) {
    return;
  }

  const missing = requiredInProduction.filter((key) => !readEnv(key));
  const missingMongoUri = !readEnv('MONGODB_URI') && !readEnv('MONGO_URI');
  const clientUrl = readEnv('CLIENT_URL');
  const googleClientId = readEnv('GOOGLE_CLIENT_ID');
  const googleClientSecret = readEnv('GOOGLE_CLIENT_SECRET');
  const googleCallbackUrl = readEnv('GOOGLE_CALLBACK_URL');
  const googleOAuthConfigured = Boolean(googleClientId || googleClientSecret || googleCallbackUrl);
  const missingGoogleOAuth = googleOAuthConfigured && (!googleClientId || !googleClientSecret || !googleCallbackUrl);
  const invalidClientUrl = isLocalhostUrl(clientUrl);
  const invalidGoogleCallback = googleCallbackUrl ? isLocalhostUrl(googleCallbackUrl) : false;
  const missingNewsKey = !readEnv('NEWS_API_KEY') && !readEnv('GNEWS_API_KEY');
  const missingLiveKeys =
    process.env.USE_MOCK_DATA === 'false'
      ? [...liveProviderKeys.filter((key) => !readEnv(key)), ...(missingNewsKey ? ['NEWS_API_KEY or GNEWS_API_KEY'] : [])]
      : [];

  if (missing.length > 0 || missingMongoUri || missingGoogleOAuth || invalidClientUrl || invalidGoogleCallback || missingLiveKeys.length > 0) {
    const allMissing = [
      ...missing,
      ...(missingMongoUri ? ['MONGO_URI or MONGODB_URI'] : []),
      ...(missingGoogleOAuth ? ['GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL'] : []),
      ...(invalidClientUrl ? ['CLIENT_URL must point to the deployed frontend'] : []),
      ...(invalidGoogleCallback ? ['GOOGLE_CALLBACK_URL must not point to localhost in production'] : []),
      ...missingLiveKeys,
    ];
    throw new Error(`Missing required production environment variables: ${allMissing.join(', ')}`);
  }
};

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  appName: process.env.APP_NAME || appName,
  port: Number(process.env.PORT) || 4000,
  mongoUri: readEnv('MONGODB_URI') || readEnv('MONGO_URI') || localMongoUri,
  jwtSecret: readEnv('JWT_SECRET', isProduction ? '' : 'local-stockiq-development-secret'),
  jwtExpiresIn: readEnv('JWT_EXPIRES_IN', '7d'),
  jwtCookieExpiresIn: Number(process.env.JWT_COOKIE_EXPIRES_IN) || 7,
  clientUrl: readEnv('CLIENT_URL') || (isProduction ? '' : 'http://localhost:5173'),
  sessionSecret: readEnv('SESSION_SECRET', isProduction ? '' : 'stockiq_session_secret'),
  googleClientId: readEnv('GOOGLE_CLIENT_ID'),
  googleClientSecret: readEnv('GOOGLE_CLIENT_SECRET'),
  googleCallbackUrl:
    readEnv('GOOGLE_CALLBACK_URL') || (isProduction ? '' : 'http://localhost:4000/api/auth/google/callback'),
  enableApiCache: readBoolean('ENABLE_API_CACHE', true),
  cacheTtlMarket: readPositiveInteger('CACHE_TTL_MARKET', 300),
  cacheTtlNews: readPositiveInteger('CACHE_TTL_NEWS', 900),
  cacheTtlAi: readPositiveInteger('CACHE_TTL_AI', 1800),
  useMockData: readBoolean('USE_MOCK_DATA', true),
  finnhubApiKey: readEnv('FINNHUB_API_KEY'),
  fmpApiKey: readEnv('FMP_API_KEY'),
  newsApiKey: readEnv('NEWS_API_KEY') || readEnv('GNEWS_API_KEY'),
  groqApiKey: readEnv('GROQ_API_KEY'),
  groqModel: readEnv('GROQ_MODEL', 'llama-3.1-8b-instant'),
  geminiApiKey: readEnv('GEMINI_API_KEY'),
  geminiModel: readEnv('GEMINI_MODEL', 'gemini-2.0-flash'),
  coinGeckoApiKey: readEnv('COINGECKO_API_KEY'),
  resendApiKey: readEnv('RESEND_API_KEY'),
  emailFromDomain: readEnv('EMAIL_FROM_DOMAIN', 'stockiq.app'),
};

module.exports = { env, validateEnv, appName, localMongoUri };
