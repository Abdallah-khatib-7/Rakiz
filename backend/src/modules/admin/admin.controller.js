const adminService = require('./admin.service');

const getUsers = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const search = req.query.search || '';
    const status = req.query.status;

    const result = await adminService.getUsers(db, { page, limit, search, status });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getUserDetail = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await adminService.getUserDetail(db, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const setUserStatus = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await adminService.setUserStatus(
      db,
      req.user.id,
      parseInt(req.params.id),
      req.body.status,
      req
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getFraudQueue = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = req.query.status || 'open';

    const result = await adminService.getFraudQueue(db, { page, limit, status });
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const reviewFraudFlag = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await adminService.reviewFraudFlag(
      db,
      req.user.id,
      parseInt(req.params.id),
      { status: req.body.status },
      req
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const adjustBalance = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await adminService.adjustBalance(
      db,
      req.user.id,
      parseInt(req.params.id),
      {
        currency: req.body.currency,
        amount: req.body.amount,
        reason: req.body.reason,
      },
      req
    );
    res.json(result);
  } catch (err) {
    next(err);
  }
};

const getRevenueStats = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const result = await adminService.getRevenueStats(db);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getUsers,
  getUserDetail,
  setUserStatus,
  getFraudQueue,
  reviewFraudFlag,
  adjustBalance,
  getRevenueStats,
};