const { v4: uuidv4 } = require('uuid');
const { convert } = require('./exchange.service');
const fraudService = require('./fraud.service');
const auditService = require('./audit.service');
const { getClientIp, generateFingerprint } = require('../utils/fingerprint');

// Ensures a wallet row exists for the given user + currency. Creates it on
// demand if not — this is the only place wallet rows are born.
const getOrCreateWallet = async (db, userId, currency) => {
  const [rows] = await db.query(
    'SELECT * FROM wallets WHERE user_id = ? AND currency = ? LIMIT 1',
    [userId, currency]
  );

  if (rows.length) return rows[0];

  const [result] = await db.query(
    'INSERT INTO wallets (user_id, currency, balance) VALUES (?, ?, 0)',
    [userId, currency]
  );

  const [created] = await db.query(
    'SELECT * FROM wallets WHERE id = ? LIMIT 1',
    [result.insertId]
  );

  return created[0];
};

// The core transfer function. Everything runs inside a single MySQL transaction
// with SELECT FOR UPDATE locks so no two concurrent sends can race on the same
// wallet. Double-entry: every debit has an exact matching credit.
//
// req is optional — pass it whenever the caller has an Express request handy
// (which is every real HTTP-triggered transfer) so fraud checks and the audit
// log get IP/fingerprint context. Internal/system transfers can omit it.
const transfer = async (db, {
  idempotencyKey,
  senderId,
  receiverId,
  amount,
  currency,
  targetCurrency,
  note,
  type = 'transfer',
  auditEventType = 'transaction.sent',
}, req = null) => {
  const connection = await db.getConnection();

  let senderBalanceBefore;

  try {
    await connection.beginTransaction();

    // lock both wallets in a consistent order (lower id first) to prevent
    // deadlocks when two transfers cross between the same two users
    const senderWallet = await getOrCreateWallet(connection, senderId, currency);
    const receiverWallet = await getOrCreateWallet(connection, receiverId, targetCurrency || currency);

    const walletIds = [senderWallet.id, receiverWallet.id].sort((a, b) => a - b);

    const [locked] = await connection.query(
      'SELECT id, balance, is_locked, currency FROM wallets WHERE id IN (?) FOR UPDATE',
      [walletIds]
    );

    const lockedSender = locked.find((w) => w.id === senderWallet.id);
    const lockedReceiver = locked.find((w) => w.id === receiverWallet.id);

    senderBalanceBefore = parseFloat(lockedSender.balance);

    if (lockedSender.is_locked) {
      throw Object.assign(new Error('Your wallet is currently locked'), { status: 403 });
    }

    if (lockedReceiver.is_locked) {
      throw Object.assign(new Error('Recipient wallet is currently locked'), { status: 403 });
    }

    if (senderBalanceBefore < parseFloat(amount)) {
      throw Object.assign(new Error('Insufficient balance'), { status: 422 });
    }

    // convert if sending cross-currency
    const isCross = targetCurrency && targetCurrency !== currency;
    const { convertedAmount, rate } = isCross
      ? await convert(amount, currency, targetCurrency)
      : { convertedAmount: amount, rate: 1 };

    // ledger entry — the source of truth for every financial event
    const [ledgerResult] = await connection.query(
      `INSERT INTO ledger_entries
         (idempotency_key, type, debit_wallet_id, credit_wallet_id,
          amount, currency, exchange_rate, fee_amount, status, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0, 'completed', ?)`,
      [
        idempotencyKey,
        type,
        senderWallet.id,
        receiverWallet.id,
        amount,
        currency,
        isCross ? rate : null,
        note || null,
      ]
    );

    const ledgerEntryId = ledgerResult.insertId;

    // debit sender
    await connection.query(
      'UPDATE wallets SET balance = balance - ? WHERE id = ?',
      [amount, senderWallet.id]
    );

    // credit receiver
    await connection.query(
      'UPDATE wallets SET balance = balance + ? WHERE id = ?',
      [convertedAmount, receiverWallet.id]
    );

    // transaction record — the user-facing view of the ledger entry
    const [txResult] = await connection.query(
      `INSERT INTO transactions
         (ledger_entry_id, sender_id, receiver_id, amount, currency,
          converted_amount, converted_currency, exchange_rate, fee, status, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'completed', ?)`,
      [
        ledgerEntryId,
        senderId,
        receiverId,
        amount,
        currency,
        isCross ? convertedAmount : null,
        isCross ? targetCurrency : null,
        isCross ? rate : null,
        note || null,
      ]
    );

    await connection.commit();

    const result = {
      transactionId: txResult.insertId,
      ledgerEntryId,
      amount,
      currency,
      convertedAmount: isCross ? convertedAmount : null,
      convertedCurrency: isCross ? targetCurrency : null,
      rate: isCross ? rate : null,
    };

    // fraud checks and audit logging run after commit, on the main pool (not
    // the released connection). They never block or roll back a completed
    // transfer — they flag for review. A failure here should never surface as
    // a failed payment to the user, so each step is isolated.
    try {
      await fraudService.checkAmountAnomaly(db, {
        userId: senderId,
        amount: parseFloat(amount),
        currency,
        ledgerEntryId,
      });

      await fraudService.checkVelocity(db, {
        userId: senderId,
        ledgerEntryId,
      });

      await fraudService.checkBalanceDrain(db, {
        userId: senderId,
        ledgerEntryId,
        balanceBefore: senderBalanceBefore,
        amount: parseFloat(amount),
      });
    } catch (err) {
      console.error(`Fraud check failed for ledger entry ${ledgerEntryId}: ${err.message}`);
    }

    if (req) {
      await auditService.logEvent({
        eventType: auditEventType,
        actorId: senderId,
        targetId: receiverId,
        ipAddress: getClientIp(req),
        deviceFingerprint: generateFingerprint(req),
        metadata: { amount, currency, ledgerEntryId, type },
      });
    }

    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

module.exports = { transfer, getOrCreateWallet };