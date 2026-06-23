const splitService = require('./split.service');

const createSplit = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const split = await splitService.createSplit(db, req.user, req.body);
    res.status(201).json({ split });
  } catch (err) {
    next(err);
  }
};

const getSplit = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const split = await splitService.getSplit(db, req.params.id, req.user.id);
    res.json({ split });
  } catch (err) {
    next(err);
  }
};

const getUserSplits = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await splitService.getUserSplits(db, req.user.id, { page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const settleMember = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const idempotencyKey = req.headers['idempotency-key'];
    const result = await splitService.settleMember(
      db,
      parseInt(req.params.id),
      req.user.id,
      {
        currency: req.body.currency,
        idempotencyKey,
      },
      req
    );
    res.json({ transaction: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSplit, getSplit, getUserSplits, settleMember };