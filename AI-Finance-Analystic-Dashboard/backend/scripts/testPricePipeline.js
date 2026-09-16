'use strict';

const assert = require('assert');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const marketService = require('../services/marketService');
const cryptoService = require('../services/cryptoService');
const { setCache, getCache, flushCache } = require('../utils/cache');

async function runTests() {
  console.log('🧪 Starting Stock-Price Accuracy & Pipeline Integration Tests...\n');

  // Test 1: Canonical Quote Metadata Structure
  console.log('Test 1: Verify Canonical Quote Structure from Stock Snapshot');
  const quote = await marketService.getStockQuote('AAPL');
  assert.ok(quote, 'Quote should exist');
  assert.strictEqual(typeof quote.price, 'number', 'Price must be a number');
  assert.ok(quote.quoteTimestamp, 'Must include quoteTimestamp');
  assert.ok(quote.receivedAt, 'Must include receivedAt');
  assert.ok(quote.source, 'Must include source provider identifier');
  assert.strictEqual(typeof quote.isFallback, 'boolean', 'Must include boolean isFallback flag');
  assert.ok(['LIVE', 'DELAYED', 'EOD', 'FALLBACK'].includes(quote.marketStatus), 'Must include valid marketStatus');
  console.log('  ✓ AAPL Quote Structure:', {
    symbol: quote.symbol,
    price: quote.price,
    currency: quote.currency,
    source: quote.source,
    isFallback: quote.isFallback,
    marketStatus: quote.marketStatus,
  });

  // Test 2: Indian Stock Currency & Exchange Metadata
  console.log('\nTest 2: Verify Indian Stock (.NS) Routing & Currency Metadata');
  const indianQuote = await marketService.getStockQuote('RELIANCE.NS');
  assert.ok(indianQuote, 'Indian quote should exist');
  assert.strictEqual(indianQuote.currency, 'INR', 'Currency must be INR for Indian stock');
  assert.strictEqual(indianQuote.exchange, 'NSE', 'Exchange must be NSE for Indian stock');
  console.log('  ✓ RELIANCE.NS Quote Structure:', {
    symbol: indianQuote.symbol,
    exchange: indianQuote.exchange,
    currency: indianQuote.currency,
    source: indianQuote.source,
    price: indianQuote.price,
  });

  // Test 3: Crypto Canonical Metadata
  console.log('\nTest 3: Verify Crypto Quote Structure (CoinGecko / Fallback)');
  const cryptoQuote = await cryptoService.getCryptoBySymbol('BTC');
  assert.ok(cryptoQuote, 'BTC quote should exist');
  assert.strictEqual(cryptoQuote.currency, 'USD', 'Currency should be USD');
  assert.ok(cryptoQuote.quoteTimestamp, 'Must include quoteTimestamp');
  assert.ok(cryptoQuote.source, 'Must include source');
  console.log('  ✓ BTC Quote Structure:', {
    symbol: cryptoQuote.symbol,
    price: cryptoQuote.price,
    source: cryptoQuote.source,
    marketStatus: cryptoQuote.marketStatus,
  });

  // Test 4: Cache Timestamp Invalidation & Stale Protection
  console.log('\nTest 4: Verify Cache Timestamp Invalidation (Older Quotes Discarded)');
  flushCache();
  const testKey = 'test_quote_ordering';
  const now = new Date();
  const newerTime = now.toISOString();
  const olderTime = new Date(now.getTime() - 60000).toISOString();

  const newerQuote = { symbol: 'TEST', price: 150, quoteTimestamp: newerTime };
  const olderQuote = { symbol: 'TEST', price: 100, quoteTimestamp: olderTime };

  setCache(testKey, newerQuote);
  const cached1 = getCache(testKey);
  assert.strictEqual(cached1.price, 150, 'Newer quote stored in cache');

  // Attempt to overwrite with an older quote
  const result = setCache(testKey, olderQuote);
  assert.strictEqual(result, false, 'Older quote overwrite rejected');
  const cached2 = getCache(testKey);
  assert.strictEqual(cached2.price, 150, 'Cache retained newer quote (150)');
  console.log('  ✓ Stale Quote Overwrite Protection Passed! (Retained newer price 150 vs older 100)');

  console.log('\n✅ ALL PRICE PIPELINE TESTS PASSED SUCCESSFULLY!');
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
