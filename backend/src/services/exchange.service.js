const axios = require('axios');
const { getRedis } = require('../config/redis');

const SUPPORTED = ['USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP'];
const CACHE_TTL = 60 * 60; // 1 hour in seconds

// Frankfurter returns rates relative to a base currency. We fetch once and
// cache the full matrix so every conversion is a local lookup, not an API call.
const fetchRates = async (base) => {
  const targets = SUPPORTED.filter((c) => c !== base).join(',');
  const { data } = await axios.get(
    `https://api.frankfurter.app/latest?from=${base}&to=${targets}`
  );
  return data.rates;
};

const getRates = async (base) => {
  if (!SUPPORTED.includes(base)) {
    throw new Error(`Unsupported currency: ${base}`);
  }

  const redis = getRedis();
  const cacheKey = `exchange:${base}`;

  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  const rates = await fetchRates(base);

  // same currency = rate of 1
  rates[base] = 1;

  await redis.set(cacheKey, JSON.stringify(rates), { EX: CACHE_TTL });

  return rates;
};

// SAR and AED are genuine government-fixed pegs to USD — these numbers don't
// move, so hardcoding them is accurate, not an approximation.
//
// LBP is different and worth being honest about: it floats on a volatile
// market with no official peg since Lebanon's currency crisis. 89,000 is a
// real snapshot rate as of June 2026, not a government-set number, and it
// WILL drift out of date as the real market rate moves. This is a deliberate
// "good enough for a demo/portfolio app" choice, not a production-grade FX
// feed — a real deployment would need a live LBP data source (most free
// rate APIs, including our own Frankfurter integration, don't carry it at
// all) or a manual update process to keep this current.
const FIXED_RATES = {
  SAR: 3.75,
  AED: 3.6725,
  LBP: 89000,
};

const getFixedRate = (fromCurrency, toCurrency) => {
  if (fromCurrency === 'USD' && FIXED_RATES[toCurrency]) {
    return FIXED_RATES[toCurrency];
  }
  if (toCurrency === 'USD' && FIXED_RATES[fromCurrency]) {
    return 1 / FIXED_RATES[fromCurrency];
  }
  if (FIXED_RATES[fromCurrency] && FIXED_RATES[toCurrency]) {
    // both fixed against USD — derive the cross rate through USD
    return FIXED_RATES[toCurrency] / FIXED_RATES[fromCurrency];
  }
  return null;
};

const convert = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, rate: 1 };
  }

  const fixedRate = getFixedRate(fromCurrency, toCurrency);
  if (fixedRate) {
    const convertedAmount = parseFloat((amount * fixedRate).toFixed(8));
    return { convertedAmount, rate: fixedRate };
  }

  const rates = await getRates(fromCurrency);

  if (!rates[toCurrency]) {
    throw new Error(`No rate available for ${fromCurrency} to ${toCurrency}`);
  }

  const rate = rates[toCurrency];
  const convertedAmount = parseFloat((amount * rate).toFixed(8));

  return { convertedAmount, rate };
};

module.exports = { getRates, convert, SUPPORTED };