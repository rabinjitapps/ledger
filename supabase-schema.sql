-- ============================================================
-- LEDGER PRO — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
  name        TEXT PRIMARY KEY,
  balance     DOUBLE PRECISION DEFAULT 0.0,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Funds table
CREATE TABLE IF NOT EXISTS funds (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  account     TEXT NOT NULL REFERENCES accounts(name),
  description TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  contact     TEXT,
  address     TEXT,
  gst         TEXT,
  email       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Ledger table
CREATE TABLE IF NOT EXISTS ledger (
  id          BIGSERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  account     TEXT NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('CR','DR')),
  amount      DOUBLE PRECISION NOT NULL,
  signed      DOUBLE PRECISION NOT NULL,
  narration   TEXT,
  ref         TEXT,
  fund_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Bills table
CREATE TABLE IF NOT EXISTS bills (
  id          BIGSERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  bill_no     TEXT NOT NULL,
  party       TEXT NOT NULL,
  total       DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  paid_amount DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  due_date    DATE,
  status      TEXT NOT NULL DEFAULT 'UNPAID' CHECK(status IN ('UNPAID','PARTIAL','PAID')),
  notes       TEXT,
  account     TEXT,
  fund_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Bill items table
CREATE TABLE IF NOT EXISTS bill_items (
  id          BIGSERIAL PRIMARY KEY,
  bill_id     BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  qty         DOUBLE PRECISION NOT NULL DEFAULT 1,
  rate        DOUBLE PRECISION NOT NULL DEFAULT 0,
  amount      DOUBLE PRECISION NOT NULL DEFAULT 0
);

-- Bill payments table
CREATE TABLE IF NOT EXISTS bill_payments (
  id          BIGSERIAL PRIMARY KEY,
  bill_id     BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  date        DATE NOT NULL,
  amount      DOUBLE PRECISION NOT NULL,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Bill deductions table
CREATE TABLE IF NOT EXISTS bill_deductions (
  id          BIGSERIAL PRIMARY KEY,
  bill_id     BIGINT NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  ded_type    TEXT NOT NULL,
  ded_amount  DOUBLE PRECISION NOT NULL
);

-- Cashbook table
CREATE TABLE IF NOT EXISTS cashbook (
  id          BIGSERIAL PRIMARY KEY,
  date        DATE NOT NULL,
  type        TEXT NOT NULL CHECK(type IN ('RECEIPT','PAYMENT')),
  amount      DOUBLE PRECISION NOT NULL,
  payer       TEXT,
  payee       TEXT,
  description TEXT,
  ref         TEXT,
  fund_name   TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- App settings (for password hash storage)
CREATE TABLE IF NOT EXISTS app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT,
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ledger_account   ON ledger(account);
CREATE INDEX IF NOT EXISTS idx_ledger_date      ON ledger(date);
CREATE INDEX IF NOT EXISTS idx_bills_status     ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_date       ON bills(date);
CREATE INDEX IF NOT EXISTS idx_cashbook_date    ON cashbook(date);
CREATE INDEX IF NOT EXISTS idx_bill_items_bill  ON bill_items(bill_id);

-- Disable RLS for single-user app (app-level auth)
ALTER TABLE accounts        DISABLE ROW LEVEL SECURITY;
ALTER TABLE funds           DISABLE ROW LEVEL SECURITY;
ALTER TABLE vendors         DISABLE ROW LEVEL SECURITY;
ALTER TABLE ledger          DISABLE ROW LEVEL SECURITY;
ALTER TABLE bills           DISABLE ROW LEVEL SECURITY;
ALTER TABLE bill_items      DISABLE ROW LEVEL SECURITY;
ALTER TABLE bill_payments   DISABLE ROW LEVEL SECURITY;
ALTER TABLE bill_deductions DISABLE ROW LEVEL SECURITY;
ALTER TABLE cashbook        DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings    DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- USER MANAGEMENT (added in v3.1)
-- Users are stored as a JSON list in app_settings key 'users_list'
-- No additional tables needed — works with existing app_settings table
-- ============================================================
-- The 'users_list' key in app_settings stores a JSON array of:
-- {
--   id: string (UUID),
--   username: string,
--   passwordHash: string (PBKDF2-SHA256 hex),
--   passwordSalt: string (UUID),
--   permissions: string[] (see Permission type in src/lib/users.ts),
--   isAdmin: false,
--   createdAt: string (ISO date),
--   active: boolean
-- }
-- Admin users (type='admin' in session) have full access to all features.
-- Regular users can only access the pages they have been granted permission for.
