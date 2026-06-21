-- Rakiz schema
-- run order matters, FK targets created before referencing tables

CREATE DATABASE IF NOT EXISTS rakiz;
USE rakiz;

SET FOREIGN_KEY_CHECKS = 0;

-- users
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  password_hash VARCHAR(255) NULL,
  full_name VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(512) NULL,
  google_id VARCHAR(255) NULL UNIQUE,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  status ENUM('active', 'frozen', 'suspended') NOT NULL DEFAULT 'active',
  subscription_tier ENUM('free', 'pro', 'business') NOT NULL DEFAULT 'free',
  subscription_expires_at DATETIME NULL,
  stripe_customer_id VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login_at DATETIME NULL,
  last_login_ip VARCHAR(255) NULL,
  INDEX idx_users_email (email),
  INDEX idx_users_google_id (google_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- user_sessions
CREATE TABLE IF NOT EXISTS user_sessions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  refresh_token_hash VARCHAR(255) NOT NULL,
  family_id VARCHAR(36) NOT NULL,
  device_fingerprint VARCHAR(255) NULL,
  ip_address VARCHAR(255) NULL,
  user_agent VARCHAR(512) NULL,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  INDEX idx_sessions_user (user_id),
  INDEX idx_sessions_family (family_id),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- wallets
CREATE TABLE IF NOT EXISTS wallets (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  currency ENUM('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP') NOT NULL,
  balance DECIMAL(18,8) NOT NULL DEFAULT 0,
  is_locked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_currency (user_id, currency),
  CONSTRAINT fk_wallets_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ledger_entries
CREATE TABLE IF NOT EXISTS ledger_entries (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  idempotency_key VARCHAR(255) NOT NULL UNIQUE,
  type ENUM('transfer', 'deposit', 'withdrawal', 'fee', 'adjustment', 'split_settle') NOT NULL,
  debit_wallet_id BIGINT UNSIGNED NULL,
  credit_wallet_id BIGINT UNSIGNED NULL,
  amount DECIMAL(18,8) NOT NULL,
  currency ENUM('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP') NOT NULL,
  exchange_rate DECIMAL(18,8) NULL,
  fee_amount DECIMAL(18,8) NOT NULL DEFAULT 0,
  status ENUM('pending', 'completed', 'failed', 'reversed') NOT NULL DEFAULT 'pending',
  reference_id VARCHAR(255) NULL,
  description VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_ledger_debit (debit_wallet_id),
  INDEX idx_ledger_credit (credit_wallet_id),
  INDEX idx_ledger_status (status),
  CONSTRAINT fk_ledger_debit FOREIGN KEY (debit_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL,
  CONSTRAINT fk_ledger_credit FOREIGN KEY (credit_wallet_id) REFERENCES wallets(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- transactions
CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  ledger_entry_id BIGINT UNSIGNED NOT NULL,
  sender_id BIGINT UNSIGNED NULL,
  receiver_id BIGINT UNSIGNED NULL,
  amount DECIMAL(18,8) NOT NULL,
  currency ENUM('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP') NOT NULL,
  converted_amount DECIMAL(18,8) NULL,
  converted_currency ENUM('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP') NULL,
  exchange_rate DECIMAL(18,8) NULL,
  fee DECIMAL(18,8) NOT NULL DEFAULT 0,
  status ENUM('pending', 'completed', 'failed', 'reversed') NOT NULL DEFAULT 'pending',
  note VARCHAR(512) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_tx_sender (sender_id),
  INDEX idx_tx_receiver (receiver_id),
  INDEX idx_tx_created (created_at),
  CONSTRAINT fk_tx_ledger FOREIGN KEY (ledger_entry_id) REFERENCES ledger_entries(id) ON DELETE CASCADE,
  CONSTRAINT fk_tx_sender FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_tx_receiver FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- splits
CREATE TABLE IF NOT EXISTS splits (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  created_by BIGINT UNSIGNED NOT NULL,
  title VARCHAR(255) NOT NULL,
  total_amount DECIMAL(18,8) NOT NULL,
  currency ENUM('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP') NOT NULL,
  split_type ENUM('equal', 'custom', 'percentage') NOT NULL,
  status ENUM('open', 'settled', 'cancelled') NOT NULL DEFAULT 'open',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  settled_at DATETIME NULL,
  INDEX idx_splits_creator (created_by),
  CONSTRAINT fk_splits_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- split_members
CREATE TABLE IF NOT EXISTS split_members (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  split_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  share_amount DECIMAL(18,8) NOT NULL,
  share_percentage DECIMAL(5,2) NULL,
  is_settled BOOLEAN NOT NULL DEFAULT FALSE,
  settled_at DATETIME NULL,
  UNIQUE KEY uq_split_user (split_id, user_id),
  INDEX idx_split_members_user (user_id),
  CONSTRAINT fk_split_members_split FOREIGN KEY (split_id) REFERENCES splits(id) ON DELETE CASCADE,
  CONSTRAINT fk_split_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- payment_requests
CREATE TABLE IF NOT EXISTS payment_requests (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  requester_id BIGINT UNSIGNED NOT NULL,
  target_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(18,8) NOT NULL,
  currency ENUM('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP') NOT NULL,
  note VARCHAR(512) NULL,
  status ENUM('pending', 'paid', 'declined', 'expired', 'cancelled') NOT NULL DEFAULT 'pending',
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_req_requester (requester_id),
  INDEX idx_req_target (target_id),
  CONSTRAINT fk_req_requester FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_req_target FOREIGN KEY (target_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- payment_links
CREATE TABLE IF NOT EXISTS payment_links (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  token VARCHAR(64) NOT NULL UNIQUE,
  amount DECIMAL(18,8) NULL,
  currency ENUM('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP') NOT NULL,
  description VARCHAR(512) NULL,
  is_single_use BOOLEAN NOT NULL DEFAULT FALSE,
  use_count INT UNSIGNED NOT NULL DEFAULT 0,
  expires_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_links_user (user_id),
  INDEX idx_links_token (token),
  CONSTRAINT fk_links_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- fraud_flags
CREATE TABLE IF NOT EXISTS fraud_flags (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  ledger_entry_id BIGINT UNSIGNED NULL,
  rule_triggered VARCHAR(255) NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'low',
  status ENUM('open', 'reviewing', 'resolved', 'dismissed') NOT NULL DEFAULT 'open',
  reviewed_by BIGINT UNSIGNED NULL,
  reviewed_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_fraud_user (user_id),
  INDEX idx_fraud_status (status),
  CONSTRAINT fk_fraud_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_fraud_ledger FOREIGN KEY (ledger_entry_id) REFERENCES ledger_entries(id) ON DELETE SET NULL,
  CONSTRAINT fk_fraud_reviewer FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- notifications
CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  type VARCHAR(64) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body VARCHAR(1024) NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  reference_id VARCHAR(255) NULL,
  reference_type VARCHAR(64) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (user_id),
  INDEX idx_notif_read (user_id, is_read),
  CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- exchange_rate_cache
CREATE TABLE IF NOT EXISTS exchange_rate_cache (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  from_currency ENUM('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP') NOT NULL,
  to_currency ENUM('USD', 'EUR', 'LBP', 'SAR', 'AED', 'GBP') NOT NULL,
  rate DECIMAL(18,8) NOT NULL,
  fetched_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_rate_pair (from_currency, to_currency)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- webhooks
CREATE TABLE IF NOT EXISTS webhooks (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  url VARCHAR(512) NOT NULL,
  secret VARCHAR(255) NOT NULL,
  events JSON NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_webhooks_user (user_id),
  CONSTRAINT fk_webhooks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;