const fs = require('fs');
const path = require('path');
const { env } = require('../config/env');
const { fetchJson: providerFetchJson } = require('./apiClient');
const sentimentService = require('./sentimentService');
const tractionService = require('./tractionService');

const dataDirectory = path.join(__dirname, '..', 'data');
const groqBaseUrl = 'https://api.groq.com/openai/v1/chat/completions';

const readJson = (fileName) => JSON.parse(fs.readFileSync(path.join(dataDirectory, fileName), 'utf8'));

const parseJsonFromText = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const match = String(text || '').match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : null;
  }
};

const fetchJson = (url, options = {}) => providerFetchJson(url, { provider: 'Groq', timeoutMs: 15000, ...options });

const getMockInsights = async (filters = {}) => {
  const insights = readJson('aiInsights.json');
  const trends = tractionService.buildMarketTrends();
  const portfolioAnalytics = readJson('portfolioAnalytics.json');
  const symbol = String(filters.symbol || '').trim().toUpperCase();

  const filterBySymbol = (items) => {
    if (!symbol) return items;
    return items.filter((item) => (item.symbols || [item.symbol]).filter(Boolean).map((value) => String(value).toUpperCase()).includes(symbol));
  };

  return {
    ...insights,
    portfolioSummary: portfolioAnalytics.summary,
    marketMomentum: trends.marketMomentum,
    topOpportunities: trends.bullishAssets.slice(0, 5).map((asset) => ({
      symbol: asset.symbol,
      name: asset.name,
      trendScore: asset.trendScore,
      recommendation: asset.recommendation,
      reason: asset.sentiment.reason,
    })),
    marketSummaries: filterBySymbol(insights.marketSummaries || []),
    recommendations: filterBySymbol(insights.recommendations || []),
    marketOpportunities: filterBySymbol(insights.marketOpportunities || []),
  };
};

const generateGroqJson = async ({ prompt, fallback }) => {
  if (!env.groqApiKey) {
    return fallback;
  }

  try {
    const payload = await fetchJson(groqBaseUrl, {
      method: 'POST',
      retries: 0,
      timeoutMs: 10000,
      headers: {
        Authorization: `Bearer ${env.groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.groqModel,
        temperature: 0.25,
        messages: [
          { role: 'system', content: 'You are StockIQ AI, a financial market intelligence engine. Return strict JSON only.' },
          { role: 'user', content: prompt },
        ],
      }),
    });

    const parsed = parseJsonFromText(payload.choices?.[0]?.message?.content || '');
    return parsed || fallback;
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      const code = error.statusCode ? ` (${error.statusCode})` : '';
      console.warn(`[Groq] live AI request failed${code}; serving fallback AI data.`);
    }

    return fallback;
  }
};

const getLiveInsights = async (filters = {}) => {
  const fallback = await getMockInsights(filters);

  return generateGroqJson({
    fallback,
    prompt: [
      'Generate StockIQ market intelligence JSON with keys:',
      'portfolioSummary, dailyMarketOverview, marketSummaries, recommendations, riskAlerts, marketOpportunities, investmentSuggestions, portfolioSuggestions, diversificationSuggestions.',
      'Use concise fintech language. Confidence must be 0..1.',
      JSON.stringify({
        symbol: filters.symbol || null,
        marketMomentum: fallback.marketMomentum,
        portfolioSummary: fallback.portfolioSummary,
        newsSentiment: await sentimentService.getNewsSentimentDashboard(filters),
      }),
    ].join('\n'),
  });
};

const getInsights = async (filters = {}) => (env.useMockData ? getMockInsights(filters) : getLiveInsights(filters));

const buildRiskFromInsights = (insights) => {
  const trends = tractionService.buildMarketTrends();

  return {
    riskAlerts: insights.riskAlerts || [],
    highRiskAssets: trends.bearishAssets.slice(0, 5),
    volatilityWarnings: trends.trendingStocks
      .filter((asset) => Math.abs(asset.changePercent || 0) >= 2)
      .slice(0, 5)
      .map((asset) => ({
        symbol: asset.symbol,
        changePercent: asset.changePercent,
        reason: `${asset.symbol} has elevated short-term price movement.`,
      })),
    exposureWarning: insights.portfolioSuggestions?.find((item) => /risk|exposure|concentration/i.test(`${item.message} ${item.action}`)) || null,
  };
};

const buildSuggestionsFromInsights = (insights) => ({
  smartRecommendations: insights.recommendations || [],
  investmentOpportunities: insights.marketOpportunities || [],
  portfolioSuggestions: insights.portfolioSuggestions || [],
  diversificationSuggestions: insights.diversificationSuggestions || insights.investmentSuggestions || [],
});

const getRisk = async (filters = {}) => buildRiskFromInsights(await getInsights(filters));

const getSuggestions = async (filters = {}) => buildSuggestionsFromInsights(await getInsights(filters));

const getNewsSentiment = (filters = {}) => sentimentService.getNewsSentimentDashboard(filters);

const getMarketTrends = () => tractionService.buildMarketTrends();

const analyzeNewsSentiment = async (newsItems = [], filters = {}) => {
  const fallback = await getNewsSentiment(filters);

  if (env.useMockData || !env.groqApiKey || newsItems.length === 0) {
    return fallback;
  }

  return generateGroqJson({
    fallback,
    prompt: [
      'Analyze these financial news items for sentiment. Return JSON with keys: items, distribution, summary.',
      'Each item must include sentiment, score, confidence, reason, and symbols if inferred.',
      JSON.stringify(newsItems.slice(0, 12)),
    ].join('\n'),
  });
};

const getCombinedSummary = async (filters = {}) => {
  const insights = await getInsights(filters);
  const [newsSentiment, marketTrends] = await Promise.all([
    getNewsSentiment(filters),
    getMarketTrends(),
  ]);
  const risk = buildRiskFromInsights(insights);
  const suggestions = buildSuggestionsFromInsights(insights);

  return {
    insights,
    risk,
    suggestions,
    newsSentiment,
    portfolioSummary: insights.portfolioSummary || null,
    marketTrends,
  };
};

const getPortfolioRecommendations = getSuggestions;
const getRiskDetection = getRisk;
const getSmartSuggestions = getSuggestions;

const { getOrSetCache } = require('../utils/cache');

const aiChat = async ({ message, history = [], portfolioContext = null }) => {
  const systemPrompt = [
    'You are StockIQ AI, a premium real-time financial intelligence copilot.',
    'You help users analyze stocks, explain technical indicators, suggest portfolio allocation, perform risk analysis, and answer market questions.',
    'Be professional, quantitative, clear, and direct. Use markdown for tables and bullets.',
    portfolioContext ? `Here is the user's portfolio context:\n${JSON.stringify(portfolioContext, null, 2)}` : 'The user has no portfolio assets loaded yet.',
  ].join('\n');

  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((msg) => ({
      role: msg.sender === 'user' ? 'user' : 'assistant',
      content: msg.text,
    })),
    { role: 'user', content: message },
  ];

  if (env.geminiApiKey) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${env.geminiModel}:generateContent?key=${env.geminiApiKey}`;
      const response = await providerFetchJson(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: messages.map((m) => ({
            role: m.role === 'system' || m.role === 'user' ? 'user' : 'model',
            parts: [{ text: (m.role === 'system' ? '[SYSTEM PROMPT]\n' : '') + m.content }],
          })),
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          },
        }),
      });

      const text = response.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) return { text };
    } catch (e) {
      console.error('[Gemini Chat Error]', e.message);
    }
  }

  if (env.groqApiKey) {
    try {
      const response = await providerFetchJson(groqBaseUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: env.groqModel,
          temperature: 0.7,
          messages: messages,
        }),
      });

      const text = response.choices?.[0]?.message?.content;
      if (text) return { text };
    } catch (e) {
      console.error('[Groq Chat Error]', e.message);
    }
  }

  return {
    text: `### StockIQ AI Copilot (Offline Mode)
I received your message: "${message}".
Please configure your \`GEMINI_API_KEY\` or \`GROQ_API_KEY\` in the backend \`.env\` file to activate live responses.

**Quick Action Links:**
* Go to [Markets](/markets) to view live prices.
* Go to [Portfolio](/portfolio) to see your virtual wallet.
* Go to [AI Insights](/ai-insights) to review pre-calculated analytics.`,
  };
};

const aiService = {
  getInsights: (filters = {}) => getOrSetCache(`ai_insights_${JSON.stringify(filters)}`, () => getInsights(filters), env.cacheTtlAi),
  getRisk: (filters = {}) => getOrSetCache(`ai_risk_${JSON.stringify(filters)}`, () => getRisk(filters), env.cacheTtlAi),
  getSuggestions: (filters = {}) => getOrSetCache(`ai_suggestions_${JSON.stringify(filters)}`, () => getSuggestions(filters), env.cacheTtlAi),
  getNewsSentiment: (filters = {}) => getOrSetCache(`ai_news_${JSON.stringify(filters)}`, () => getNewsSentiment(filters), env.cacheTtlAi),
  getMarketTrends: () => getOrSetCache('ai_market_trends', () => getMarketTrends(), env.cacheTtlAi),
  analyzeNewsSentiment: (newsItems, filters) => getOrSetCache(`ai_analyze_${JSON.stringify(filters)}`, () => analyzeNewsSentiment(newsItems, filters), env.cacheTtlAi),
  getPortfolioRecommendations,
  getRiskDetection,
  getSmartSuggestions,
  getCombinedSummary: (filters = {}) => getOrSetCache(`ai_summary_${JSON.stringify(filters)}`, () => getCombinedSummary(filters), env.cacheTtlAi),
  chat: aiChat,
};

module.exports = aiService;
