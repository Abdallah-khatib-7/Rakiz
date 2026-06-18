const mongoose = require('mongoose');

const aiInsightSchema = new mongoose.Schema({
  user_id: { type: Number, required: true, index: true },
  // stored as 'YYYY-MM' so each user has at most one insight doc per month
  month: { type: String, required: true },
  total_sent: { type: Number, default: 0 },
  total_received: { type: Number, default: 0 },
  top_categories: { type: [String], default: [] },
  anomalies_detected: { type: mongoose.Schema.Types.Mixed, default: [] },
  savings_suggestions: { type: [String], default: [] },
  summary_text: { type: String, default: '' },
  generated_at: { type: Date, default: Date.now },
});

// one insight document per user per month — regenerating overwrites rather
// than duplicating
aiInsightSchema.index({ user_id: 1, month: 1 }, { unique: true });

module.exports = mongoose.model('AiInsight', aiInsightSchema);