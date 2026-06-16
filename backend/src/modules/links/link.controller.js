const linkService = require('./link.service');

const createLink = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const link = await linkService.createLink(db, req.user.id, req.body);
    res.status(201).json({ link });
  } catch (err) {
    next(err);
  }
};

const getLink = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const link = await linkService.getLink(db, parseInt(req.params.id), req.user.id);
    res.json({ link });
  } catch (err) {
    next(err);
  }
};

const getUserLinks = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await linkService.getUserLinks(db, req.user.id, { page, limit });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getLinkByToken = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const link = await linkService.getLinkByToken(db, req.params.token);
    res.json({ link });
  } catch (err) {
    next(err);
  }
};

const payLink = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const idempotencyKey = req.headers['idempotency-key'];
    const result = await linkService.payLink(
      db,
      req.params.token,
      req.user.id,
      {
        amount: req.body.amount,
        currency: req.body.currency,
        idempotencyKey,
      }
    );
    res.json({ transaction: result });
  } catch (err) {
    next(err);
  }
};

const deleteLink = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await linkService.deleteLink(db, parseInt(req.params.id), req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { createLink, getLink, getUserLinks, getLinkByToken, payLink, deleteLink };