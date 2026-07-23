const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');

// ─── STOCKS GENERATOR ────────────────────────────────────────────────────────
const stockSectors = ['Energy', 'Financial Services', 'Technology', 'Healthcare', 'Industrials', 'Consumer Defensive', 'Utilities', 'Basic Materials', 'Real Estate', 'Communication Services'];
const stockIndustries = {
  'Energy': ['Oil & Gas Exploration', 'Refining', 'Renewable Energy'],
  'Financial Services': ['Private Bank', 'Insurance', 'Asset Management', 'Investment Banking'],
  'Technology': ['Software—Infrastructure', 'Semiconductors', 'IT Services', 'Hardware'],
  'Healthcare': ['Pharmaceuticals', 'Biotechnology', 'Medical Devices'],
  'Industrials': ['Aerospace & Defense', 'Railroads', 'Specialty Machinery'],
  'Consumer Defensive': ['Beverages—Non-Alcoholic', 'Packaged Foods', 'Discount Stores'],
  'Utilities': ['Regulated Electric', 'Regulated Water', 'Independent Power'],
  'Basic Materials': ['Specialty Chemicals', 'Steel', 'Gold Mining'],
  'Real Estate': ['REIT—Office', 'REIT—Residential', 'REIT—Retail'],
  'Communication Services': ['Telecom Services', 'Entertainment', 'Internet Content & Information']
};

const stockSymbols = [
  'RELIANCE', 'HDFCBANK', 'TCS', 'INFY', 'ICICIBANK', 'BHARTIARTL', 'SBI', 'LICI', 'ITC', 'HINDUNILVR',
  'LT', 'HCLTECH', 'BAJFINANCE', 'AXISBANK', 'MARUTI', 'SUNPHARMA', 'ADANIENT', 'KOTAKBANK', 'TITAN', 'ONGC',
  'NTPC', 'TATASTEEL', 'POWERGRID', 'ADANIPORTS', 'ASIANPAINT', 'COALINDIA', 'WIPRO', 'BAJAJFINS', 'JSWSTEEL', 'INDUSINDBK',
  'TECHM', 'M&M', 'ULTRACEMCO', 'HINDALCO', 'GRASIM', 'SBILIFE', 'BPCL', 'DRREDDY', 'ADANIPOWER', 'TATAMOTORS'
];

function generateStocks() {
  const stocks = [];

  // 1. Add real initial stocks to preserve existing tests/demo items
  const baseStocks = [
    {
      "symbol": "RELIANCE",
      "name": "Reliance Industries Ltd.",
      "exchange": "NSE",
      "country": "IN",
      "currency": "INR",
      "assetType": "stock",
      "sector": "Energy",
      "industry": "Oil, Gas & Retail",
      "price": 2924.65,
      "previousClose": 2896.2,
      "change": 28.45,
      "changePercent": 0.98,
      "marketCap": 19780000000000,
      "volume": 6824100,
      "averageVolume": 5943000,
      "peRatio": 27.8,
      "eps": 105.24,
      "dividendYield": 0.34,
      "high52": 3024.9,
      "low52": 2390.15,
      "beta": 0.91,
      "analystRating": "Buy",
      "sparkline": [2868.4, 2875.8, 2889.25, 2896.2, 2908.7, 2916.15, 2924.65]
    },
    {
      "symbol": "HDFCBANK",
      "name": "HDFC Bank Ltd.",
      "exchange": "NSE",
      "country": "IN",
      "currency": "INR",
      "assetType": "stock",
      "sector": "Financial Services",
      "industry": "Private Bank",
      "price": 1748.3,
      "previousClose": 1719.45,
      "change": 28.85,
      "changePercent": 1.68,
      "marketCap": 13350000000000,
      "volume": 12450000,
      "averageVolume": 15400000,
      "peRatio": 19.5,
      "eps": 89.65,
      "dividendYield": 1.14,
      "high52": 1794.0,
      "low52": 1363.45,
      "beta": 1.05,
      "analystRating": "Strong Buy",
      "sparkline": [1685.2, 1690.4, 1705.8, 1719.45, 1728.1, 1735.6, 1748.3]
    },
    {
      "symbol": "INFY",
      "name": "Infosys Ltd.",
      "exchange": "NSE",
      "country": "IN",
      "currency": "INR",
      "assetType": "stock",
      "sector": "Technology",
      "industry": "IT Services",
      "price": 1542.4,
      "previousClose": 1565.8,
      "change": -23.4,
      "changePercent": -1.49,
      "marketCap": 6412000000000,
      "volume": 4120000,
      "averageVolume": 5800000,
      "peRatio": 25.1,
      "eps": 61.45,
      "dividendYield": 2.46,
      "high52": 1733.0,
      "low52": 1352.0,
      "beta": 0.88,
      "analystRating": "Hold",
      "sparkline": [1580.4, 1576.2, 1570.8, 1565.8, 1555.2, 1548.9, 1542.4]
    },
    {
      "symbol": "TCS",
      "name": "Tata Consultancy Services Ltd.",
      "exchange": "NSE",
      "country": "IN",
      "currency": "INR",
      "assetType": "stock",
      "sector": "Technology",
      "industry": "IT Services",
      "price": 3845.2,
      "previousClose": 3812.6,
      "change": 32.6,
      "changePercent": 0.86,
      "marketCap": 14070000000000,
      "volume": 2100000,
      "averageVolume": 2800000,
      "peRatio": 29.8,
      "eps": 129.03,
      "dividendYield": 1.25,
      "high52": 4254.0,
      "low52": 3156.0,
      "beta": 0.76,
      "analystRating": "Buy",
      "sparkline": [3785.4, 3792.1, 3804.8, 3812.6, 3822.4, 3833.9, 3845.2]
    },
    {
      "symbol": "AAPL",
      "name": "Apple Inc.",
      "exchange": "NASDAQ",
      "country": "US",
      "currency": "USD",
      "assetType": "stock",
      "sector": "Technology",
      "industry": "Consumer Electronics",
      "price": 242.85,
      "previousClose": 240.12,
      "change": 2.73,
      "changePercent": 1.14,
      "marketCap": 3680000000000,
      "volume": 52400000,
      "averageVolume": 61200000,
      "peRatio": 34.2,
      "eps": 7.10,
      "dividendYield": 0.41,
      "high52": 248.5,
      "low52": 164.08,
      "beta": 1.12,
      "analystRating": "Buy",
      "sparkline": [236.4, 237.8, 239.1, 240.12, 241.05, 241.95, 242.85]
    },
    {
      "symbol": "TSLA",
      "name": "Tesla Inc.",
      "exchange": "NASDAQ",
      "country": "US",
      "currency": "USD",
      "assetType": "stock",
      "sector": "Consumer Cyclical",
      "industry": "Auto Manufacturers",
      "price": 318.4,
      "previousClose": 328.6,
      "change": -10.2,
      "changePercent": -3.10,
      "marketCap": 1020000000000,
      "volume": 84500000,
      "averageVolume": 92000000,
      "peRatio": 72.4,
      "eps": 4.40,
      "dividendYield": 0,
      "high52": 358.5,
      "low52": 138.8,
      "beta": 2.15,
      "analystRating": "Hold",
      "sparkline": [338.4, 335.2, 331.0, 328.6, 325.2, 321.8, 318.4]
    },
    {
      "symbol": "NVDA",
      "name": "NVIDIA Corp.",
      "exchange": "NASDAQ",
      "country": "US",
      "currency": "USD",
      "assetType": "stock",
      "sector": "Technology",
      "industry": "Semiconductors",
      "price": 138.65,
      "previousClose": 134.12,
      "change": 4.53,
      "changePercent": 3.38,
      "marketCap": 3410000000000,
      "volume": 124000000,
      "averageVolume": 142000000,
      "peRatio": 64.5,
      "eps": 2.15,
      "dividendYield": 0.03,
      "high52": 149.77,
      "low52": 45.68,
      "beta": 1.85,
      "analystRating": "Strong Buy",
      "sparkline": [128.4, 130.15, 132.8, 134.12, 136.05, 137.2, 138.65]
    }
  ];

  stocks.push(...baseStocks);

  // 2. Generate remaining up to 1050 stocks
  const targetCount = 1050;
  const existingSymbols = new Set(stocks.map((s) => s.symbol));

  for (let i = 1; stocks.length < targetCount; i++) {
    const symbolIndex = i % stockSymbols.length;
    const baseSymbol = stockSymbols[symbolIndex];
    const suffix = Math.floor(i / stockSymbols.length);
    const symbol = `${baseSymbol}${suffix > 0 ? suffix : ''}`;

    if (existingSymbols.has(symbol)) continue;
    existingSymbols.add(symbol);

    const price = Math.round((Math.random() * 4500 + 50) * 100) / 100;
    const isUp = Math.random() > 0.48;
    const changePercent = Math.round((Math.random() * 4.8 * (isUp ? 1 : -1)) * 100) / 100;
    const change = Math.round((price * (changePercent / 100)) * 100) / 100;
    const previousClose = Math.round((price - change) * 100) / 100;

    const sector = stockSectors[i % stockSectors.length];
    const industries = stockIndustries[sector];
    const industry = industries[i % industries.length];

    const marketCap = Math.floor((Math.random() * 1000 + 1) * 100000000);
    const volume = Math.floor(Math.random() * 5000000 + 10000);

    const ratings = ['Strong Buy', 'Buy', 'Hold', 'Sell'];
    const analystRating = ratings[Math.floor(Math.random() * ratings.length)];

    const sparkline = [];
    let temp = previousClose;
    for (let j = 0; j < 6; j++) {
      temp = Math.round((temp + (Math.random() - 0.5) * (price * 0.02)) * 100) / 100;
      sparkline.push(temp);
    }
    sparkline.push(price);

    stocks.push({
      symbol,
      name: `${symbol.charAt(0) + symbol.slice(1).toLowerCase()} Industries Group`,
      exchange: Math.random() > 0.3 ? 'NSE' : 'NASDAQ',
      country: Math.random() > 0.3 ? 'IN' : 'US',
      currency: Math.random() > 0.3 ? 'INR' : 'USD',
      assetType: 'stock',
      sector,
      industry,
      price,
      previousClose,
      change,
      changePercent,
      marketCap,
      volume,
      averageVolume: Math.floor(volume * 1.2),
      peRatio: Math.round((Math.random() * 45 + 5) * 10) / 10,
      eps: Math.round((Math.random() * 200 - 10) * 100) / 100,
      dividendYield: Math.round(Math.random() * 3.5 * 100) / 100,
      high52: Math.round((price * (1 + Math.random() * 0.25)) * 100) / 100,
      low52: Math.round((price * (1 - Math.random() * 0.25)) * 100) / 100,
      beta: Math.round((Math.random() * 1.8 + 0.2) * 100) / 100,
      analystRating,
      sparkline
    });
  }

  return stocks;
}

// ─── CRYPTO GENERATOR ────────────────────────────────────────────────────────
const cryptoNames = [
  'Bitcoin', 'Ethereum', 'Solana', 'Ripple', 'Cardano', 'Polkadot', 'Avalanche', 'Chainlink', 'Polygon', 'Uniswap',
  'Stellar', 'Cosmos', 'Litecoin', 'Near', 'Fantom', 'Arbitrum', 'Optimism', 'Sui', 'Aptos', 'Monero',
  'Filecoin', 'Hedera', 'Algorand', 'Vechain', 'Tezos', 'Graphs', 'Sandbox', 'Decentraland', 'Theta', 'Flow'
];
const cryptoSymbols = [
  'BTC', 'ETH', 'SOL', 'XRP', 'ADA', 'DOT', 'AVAX', 'LINK', 'MATIC', 'UNI',
  'XLM', 'ATOM', 'LTC', 'NEAR', 'FTM', 'ARB', 'OP', 'SUI', 'APT', 'XMR',
  'FIL', 'HBAR', 'ALGO', 'VET', 'XTZ', 'GRT', 'SAND', 'MANA', 'THETA', 'FLOW'
];

function generateCrypto() {
  const cryptos = [];

  // 1. Add base cryptos
  const baseCryptos = [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "assetType": "crypto",
      "exchange": "Global",
      "currency": "USD",
      "price": 109450.2,
      "previousClose": 107880.5,
      "change": 1569.7,
      "changePercent": 1.46,
      "marketCap": 2162000000000,
      "volume": 48750000000,
      "circulatingSupply": 19752000,
      "rank": 1,
      "high52": 112840.0,
      "low52": 54320.4,
      "sparkline": [105880, 106420, 107120, 107880.5, 108640, 109010, 109450.2]
    },
    {
      "symbol": "ETH",
      "name": "Ethereum",
      "assetType": "crypto",
      "exchange": "Global",
      "currency": "USD",
      "price": 5264.8,
      "previousClose": 5178.1,
      "change": 86.7,
      "changePercent": 1.67,
      "marketCap": 635000000000,
      "volume": 24100000000,
      "circulatingSupply": 120720000,
      "rank": 2,
      "high52": 5486.2,
      "low52": 2314.8,
      "sparkline": [5050.2, 5098.6, 5132.7, 5178.1, 5214.9, 5240.3, 5264.8]
    },
    {
      "symbol": "SOL",
      "name": "Solana",
      "assetType": "crypto",
      "exchange": "Global",
      "currency": "USD",
      "price": 284.15,
      "previousClose": 268.4,
      "change": 15.75,
      "changePercent": 5.87,
      "marketCap": 132000000000,
      "volume": 6800000000,
      "circulatingSupply": 462000000,
      "rank": 3,
      "high52": 292.0,
      "low52": 98.5,
      "sparkline": [262.1, 264.8, 266.0, 268.4, 273.9, 278.2, 284.15]
    }
  ];

  cryptos.push(...baseCryptos);

  // 2. Generate remaining up to 1050 cryptos
  const targetCount = 1050;
  const existingSymbols = new Set(cryptos.map((c) => c.symbol));

  for (let i = 1; cryptos.length < targetCount; i++) {
    const symbolIndex = i % cryptoSymbols.length;
    const baseSymbol = cryptoSymbols[symbolIndex];
    const nameIndex = i % cryptoNames.length;
    const baseName = cryptoNames[nameIndex];
    const suffix = Math.floor(i / cryptoSymbols.length);

    const symbol = `${baseSymbol}${suffix > 0 ? suffix : ''}`;
    const name = `${baseName} ${suffix > 0 ? suffix : ''}`;

    if (existingSymbols.has(symbol)) continue;
    existingSymbols.add(symbol);

    const price = Math.round((Math.random() * 250 + 0.05) * 10000) / 10000;
    const isUp = Math.random() > 0.45;
    const changePercent = Math.round((Math.random() * 12.5 * (isUp ? 1 : -1)) * 100) / 100;
    const change = Math.round((price * (changePercent / 100)) * 10000) / 10000;
    const previousClose = Math.round((price - change) * 10000) / 10000;

    const marketCap = Math.floor(Math.random() * 5000000000 + 10000000);
    const volume = Math.floor(Math.random() * 1200000000 + 5000000);
    const circulatingSupply = Math.floor(Math.random() * 10000000000 + 100000);

    const sparkline = [];
    let temp = previousClose;
    for (let j = 0; j < 6; j++) {
      temp = Math.round((temp + (Math.random() - 0.5) * (price * 0.05)) * 10000) / 10000;
      sparkline.push(temp);
    }
    sparkline.push(price);

    cryptos.push({
      symbol,
      name,
      assetType: 'crypto',
      exchange: 'Global',
      currency: 'USD',
      price,
      previousClose,
      change,
      changePercent,
      marketCap,
      volume,
      circulatingSupply,
      rank: cryptos.length + 1,
      high52: Math.round((price * (1 + Math.random() * 0.5)) * 10000) / 10000,
      low52: Math.round((price * (1 - Math.random() * 0.5)) * 10000) / 10000,
      sparkline
    });
  }

  return cryptos;
}

// Write to files
console.log('Generating stocks.json...');
const stocks = generateStocks();
fs.writeFileSync(path.join(dataDir, 'stocks.json'), JSON.stringify(stocks, null, 2));
console.log(`Generated ${stocks.length} stocks successfully.`);

console.log('Generating crypto.json...');
const cryptos = generateCrypto();
fs.writeFileSync(path.join(dataDir, 'crypto.json'), JSON.stringify(cryptos, null, 2));
console.log(`Generated ${cryptos.length} cryptos successfully.`);
