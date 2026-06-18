const OpenAI = require('openai');
const AiInsight = require('../modules/ai/ai.model');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const MODEL = 'gpt-4o-mini'; // cheap and fast enough for summarization tasks like these

const httpError = (status, message) =>
  Object.assign(new Error(message), { status });

// Pulls the raw numbers for a given month so the AI has real data to reason
// over instead of guessing. month is 'YYYY-MM'.
const getMonthlyTransactionData = async (db, userId, month) => {
  const startDate = `${month}-01`;

  const [sent] = await db.query(
    `SELECT amount, currency, note, created_at
       FROM transactions
      WHERE sender_id = ?
        AND DATE_FORMAT(created_at, '%Y-%m') = ?`,
    [userId, month]
  );

  const [received] = await db.query(
    `SELECT amount, currency, note, created_at
       FROM transactions
      WHERE receiver_id = ?
        AND DATE_FORMAT(created_at, '%Y-%m') = ?`,
    [userId, month]
  );

  const totalSent = sent.reduce((sum, t) => sum + parseFloat(t.amount), 0);
  const totalReceived = received.reduce((sum, t) => sum + parseFloat(t.amount), 0);

  return { sent, received, totalSent, totalReceived, startDate };
};

// Generates (or regenerates) a monthly insight document. Calls OpenAI once
// with the month's transaction notes and totals, asks for a structured JSON
// response so we can store fields separately rather than parsing free text.
const generateMonthlyInsight = async (db, userId, month) => {
  const { sent, received, totalSent, totalReceived } = await getMonthlyTransactionData(db, userId, month);

  if (sent.length === 0 && received.length === 0) {
    throw httpError(404, `No transactions found for ${month}`);
  }

  const transactionSummary = [
    ...sent.map((t) => `Sent ${t.amount} ${t.currency}${t.note ? ` (${t.note})` : ''}`),
    ...received.map((t) => `Received ${t.amount} ${t.currency}${t.note ? ` (${t.note})` : ''}`),
  ].join('\n');

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a financial insights assistant for a digital wallet app. ' +
          'Given a list of a user\'s transactions for one month, respond with ' +
          'a JSON object containing: top_categories (array of up to 5 short ' +
          'strings inferred from transaction notes, e.g. "Food", "Rent", ' +
          '"Transfers" — use "Uncategorized" if notes are empty or unclear), ' +
          'savings_suggestions (array of up to 3 short, specific, actionable ' +
          'sentences), and summary_text (a 2-3 sentence plain-language summary ' +
          'of the month\'s activity). Do not invent numbers not present in the data.',
      },
      {
        role: 'user',
        content: `Month: ${month}\nTotal sent: ${totalSent}\nTotal received: ${totalReceived}\n\nTransactions:\n${transactionSummary}`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content);

  const insight = await AiInsight.findOneAndUpdate(
    { user_id: userId, month },
    {
      user_id: userId,
      month,
      total_sent: totalSent,
      total_received: totalReceived,
      top_categories: parsed.top_categories || [],
      savings_suggestions: parsed.savings_suggestions || [],
      summary_text: parsed.summary_text || '',
      generated_at: new Date(),
    },
    { upsert: true, new: true }
  );

  return insight;
};

const getInsight = async (userId, month) => {
  const insight = await AiInsight.findOne({ user_id: userId, month });
  if (!insight) {
    throw httpError(404, `No insight generated for ${month} yet`);
  }
  return insight;
};

// Anomaly detection with reasoning, separate from the fraud rule engine.
// fraud.service.js catches hard-coded thresholds (amount, velocity, drain);
// this asks the model to look at the shape of a month's spending and explain
// in plain language anything that looks unusual, the way a human reviewing
// a statement would.
const detectAnomalies = async (db, userId, month) => {
  const { sent, received, totalSent, totalReceived } = await getMonthlyTransactionData(db, userId, month);

  if (sent.length === 0 && received.length === 0) {
    return { anomalies: [] };
  }

  const transactionList = [...sent, ...received]
    .map((t) => `${t.amount} ${t.currency} on ${t.created_at.toISOString().slice(0, 10)}${t.note ? ` - ${t.note}` : ''}`)
    .join('\n');

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You review a user\'s monthly transaction list for a digital wallet ' +
          'and flag anything unusual: an unusually large single transaction ' +
          'relative to the rest, an unusual cluster of transactions in a short ' +
          'window, or a transaction notably different from the user\'s typical ' +
          'pattern. Respond with JSON: { "anomalies": [ { "description": string, ' +
          '"reasoning": string } ] }. Return an empty array if nothing stands out. ' +
          'Be conservative — only flag things a careful human reviewer would ' +
          'actually notice, not every transaction.',
      },
      {
        role: 'user',
        content: `Total sent this month: ${totalSent}\nTotal received: ${totalReceived}\n\nTransactions:\n${transactionList}`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  const anomalies = parsed.anomalies || [];

  // persist onto the same monthly doc so anomaly history isn't lost
  await AiInsight.findOneAndUpdate(
    { user_id: userId, month },
    { user_id: userId, month, anomalies_detected: anomalies },
    { upsert: true }
  );

  return { anomalies };
};

// Natural language search over a user's own transaction history. We don't
// let the model write SQL directly — that's a real injection/abuse surface.
// Instead we fetch a bounded window of the user's recent transactions and ask
// the model to filter/rank them against the query, returning only IDs it
// matched plus a short reason. This keeps the model's role to interpretation,
// not data access.
const searchTransactions = async (db, userId, query) => {
  const [rows] = await db.query(
    `SELECT t.id, t.amount, t.currency, t.note, t.created_at,
            s.full_name AS sender_name, r.full_name AS receiver_name,
            CASE WHEN t.sender_id = ? THEN 'sent' ELSE 'received' END AS direction
       FROM transactions t
       LEFT JOIN users s ON s.id = t.sender_id
       LEFT JOIN users r ON r.id = t.receiver_id
      WHERE t.sender_id = ? OR t.receiver_id = ?
      ORDER BY t.created_at DESC
      LIMIT 200`,
    [userId, userId, userId]
  );

  if (!rows.length) {
    return { results: [] };
  }

  const transactionList = rows
    .map((t) => `id:${t.id} | ${t.direction} | ${t.amount} ${t.currency} | ${t.direction === 'sent' ? t.receiver_name : t.sender_name} | ${t.note || 'no note'} | ${t.created_at.toISOString().slice(0, 10)}`)
    .join('\n');

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You search a list of transactions for ones matching a natural ' +
          'language query about person, amount, date range, or note content. ' +
          'Respond with JSON: { "matching_ids": [number, ...] } containing only ' +
          'the id values of transactions that genuinely match. Return an empty ' +
          'array if nothing matches. Do not include ids not present in the list.',
      },
      {
        role: 'user',
        content: `Query: "${query}"\n\nTransactions:\n${transactionList}`,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  const matchingIds = new Set(parsed.matching_ids || []);

  const results = rows.filter((t) => matchingIds.has(t.id));

  return { results };
};

module.exports = {
  generateMonthlyInsight,
  getInsight,
  detectAnomalies,
  searchTransactions,
};