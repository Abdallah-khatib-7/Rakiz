const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const subscriptionRoutes = require('./modules/subscriptions/subscription.routes');
const walletRoutes = require('./modules/wallets/wallet.routes');
const authRoutes = require('./modules/auth/auth.routes');
const splitRoutes = require('./modules/splits/split.routes');
const requestRoutes = require('./modules/requests/request.routes');
const linkRoutes = require('./modules/links/link.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const adminRoutes = require('./modules/admin/admin.routes');
const userRoutes = require('./modules/users/user.routes');


const app = express();

// behind nginx in prod, need real client IP for rate limiting + fraud rules
app.set('trust proxy', 1);

app.use(helmet());

const allowedOrigins = [process.env.FRONTEND_URL];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Stripe webhook must be mounted before express.json() below — it needs the
// raw body for signature verification, and once express.json() consumes the
// stream the raw bytes are gone. Mounting the whole subscriptions router here
// (instead of with the others further down) keeps this ordering constraint
// visible in one place. The router itself applies express.raw() only to its
// /webhook path; its other routes (checkout, portal) use normal JSON further
// down the chain like everything else.
app.use('/api/subscriptions', subscriptionRoutes);

// keep payloads small, financial endpoints don't need more than this
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

app.use(morgan('dev'));
 
app.use(cookieParser());

app.use(passport.initialize());
 
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'rakiz-api',
    timestamp: new Date().toISOString(),
  });
});

// routes mounted here per module
app.use('/api/auth', authRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/splits', splitRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message =
    process.env.NODE_ENV === 'production' && status === 500
      ? 'Internal server error'
      : err.message;

  res.status(status).json({ error: message });
});

module.exports = app;


  