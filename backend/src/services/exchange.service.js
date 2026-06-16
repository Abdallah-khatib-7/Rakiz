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

const convert = async (amount, fromCurrency, toCurrency) => {
  if (fromCurrency === toCurrency) {
    return { convertedAmount: amount, rate: 1 };
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