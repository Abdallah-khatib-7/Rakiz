const aiService = require('../../services/ai.service');

const generateInsight = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const month = req.body.month;
    const insight = await aiService.generateMonthlyInsight(db, req.user.id, month);
    res.status(201).json({ insight });
  } catch (err) {
    next(err);
  }
};

const getInsight = async (req, res, next) => {
  try {
    const insight = await aiService.getInsight(req.user.id, req.params.month);
    res.json({ insight });
  } catch (err) {
    next(err);
  }
};

const detectAnomalies = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const month = req.body.month;
    const result = await aiService.detectAnomalies(db, req.user.id, month);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const searchTransactions = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const query = req.body.query;
    const result = await aiService.searchTransactions(db, req.user.id, query);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { generateInsight, getInsight, detectAnomalies, searchTransactions };