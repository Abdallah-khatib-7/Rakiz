const walletService = require('./wallet.service');

const getWallets = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const wallets = await walletService.getWallets(db, req.user.id);
    res.json({ wallets });
  } catch (err) {
    next(err);
  }
};

const getWallet = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const wallet = await walletService.getWallet(db, req.user.id, req.params.currency.toUpperCase());
    res.json({ wallet });
  } catch (err) {
    next(err);
  }
};

const send = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const idempotencyKey = req.headers['idempotency-key'];

    const result = await walletService.send(db, req.user.id, {
      idempotencyKey,
      receiverEmail: req.body.receiver_email,
      amount: req.body.amount,
      currency: req.body.currency,
      targetCurrency: req.body.target_currency,
      note: req.body.note,
    }, req);

    res.status(201).json({ transaction: result });
  } catch (err) {
    next(err);
  }
};

const getTransactions = async (req, res, next) => {
  try {
    const db = req.app.get('db');
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const currency = req.query.currency?.toUpperCase();

    const result = await walletService.getTransactions(db, req.user.id, {
      page,
      limit,
      currency,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
};

module.exports = { getWallets, getWallet, send, getTransactions };