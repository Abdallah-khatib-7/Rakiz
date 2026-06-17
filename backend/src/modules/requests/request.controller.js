const requestService = require('./request.service');

const createRequest = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const request = await requestService.createRequest(db, req.user.id, req.body);
    res.status(201).json({ request });
  } catch (err) {
    next(err);
  }
};

const getRequest = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const request = await requestService.getRequest(db, parseInt(req.params.id), req.user.id);
    res.json({ request });
  } catch (err) {
    next(err);
  }
};

const getUserRequests = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const type = req.query.type || 'all';
    const result = await requestService.getUserRequests(db, req.user.id, { page, limit, type });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const payRequest = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const idempotencyKey = req.headers['idempotency-key'];
    const result = await requestService.payRequest(
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

const declineRequest = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await requestService.declineRequest(db, parseInt(req.params.id), req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const cancelRequest = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await requestService.cancelRequest(db, parseInt(req.params.id), req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { createRequest, getRequest, getUserRequests, payRequest, declineRequest, cancelRequest };