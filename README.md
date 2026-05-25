# RD's Ledger Pro — v3.0

> ⚠️ **This is a Next.js app — open `START.md` for setup instructions.**
> Do NOT open HTML files directly. Run `npm run dev` then visit `http://localhost:3000`

# RD's Ledger Pro — Next.js v3.0

A full-featured web accounting application converted from Python/Tkinter to Next.js 14 + Supabase.

## Tech Stack
- **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS
- **Backend:** Next.js API Routes (Vercel serverless)
- **Database:** Supabase (PostgreSQL)
- **Auth:** Cookie-based session with PBKDF2 password hashing

## Features
- 📊 Dashboard with stats, charts, and recent activity
- 📒 Ledger Book — double-entry CR/DR entries
- 🧾 Bill Register — full bill lifecycle with line items, deductions (SGST/CGST/IGST/TDS), partial payments
- 👥 Vendor Management
- 💰 Cashbook — RECEIPT & PAYMENT entries with auto ledger
- 🏦 Accounts Summary — balances with CR/DR position
- 📁 Fund Details — fund-wise balance tracking
- ⚖️ Trial Balance — double-entry verification
- 📈 Reports — date-range, account-wise, fund-wise reports
- 🔒 Password-protected login

## Project Structure

```
ledger-pro/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Root redirect
│   │   ├── layout.tsx                  # Root layout + Toaster
│   │   ├── globals.css                 # Theme variables + components
│   │   ├── login/page.tsx
│   │   ├── dashboard/page.tsx
│   │   ├── ledger/page.tsx
│   │   ├── bills/page.tsx
│   │   ├── vendors/page.tsx
│   │   ├── cashbook/page.tsx
│   │   ├── accounts/page.tsx           ✅ NEW
│   │   ├── funds/page.tsx              ✅ NEW
│   │   ├── trial-balance/page.tsx      ✅ NEW
│   │   ├── reports/page.tsx            ✅ NEW
│   │   └── api/
│   │       ├── auth/login/route.ts
│   │       ├── auth/logout/route.ts
│   │       ├── auth/change-password/route.ts  ✅ NEW
│   │       ├── dashboard/route.ts
│   │       ├── ledger/route.ts
│   │       ├── bills/route.ts
│   │       ├── bill-payments/route.ts
│   │       ├── vendors/route.ts
│   │       ├── cashbook/route.ts
│   │       ├── accounts/route.ts
│   │       ├── funds/route.ts
│   │       ├── funds/balances/route.ts ✅ NEW
│   │       ├── trial-balance/route.ts  ✅ NEW
│   │       └── reports/route.ts        ✅ NEW
│   ├── components/
│   │   ├── AppLayout.tsx               # Sidebar layout
│   │   ├── EmptyState.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Spinner.tsx
│   │   └── StatCard.tsx
│   ├── lib/
│   │   ├── supabase.ts                 # Supabase clients
│   │   ├── auth.ts                     # Password hashing & session
│   │   ├── utils.ts                    # Helpers
│   │   └── types.ts                    # TypeScript interfaces
│   └── middleware.ts                   # ✅ NEW — Auth protection
├── supabase-schema.sql                 # Run in Supabase SQL Editor
├── package.json
├── tailwind.config.js
├── next.config.js
└── .env.local.example
```

## Setup

### 1. Create Supabase Project
1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run `supabase-schema.sql`

### 2. Configure Environment
```bash
cp .env.local.example .env.local
```
Edit `.env.local` and fill in your Supabase credentials:
- `NEXT_PUBLIC_SUPABASE_URL` — from Project Settings → API
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from Project Settings → API
- `SUPABASE_SERVICE_ROLE_KEY` — from Project Settings → API (service role key)

### 3. Install & Run
```bash
npm install
npm run dev
```

### 4. First Login
Default password is `admin`. You'll be prompted to change it after first login.

## Deploy to Vercel
1. Push to GitHub
2. Import in [vercel.com](https://vercel.com)
3. Add environment variables in Vercel Project Settings
4. Deploy!

## Default Credentials
- **Password:** `admin` (change immediately after first login)

## Data Migration from Python App
If you have data in a PostgreSQL database from the Python app, you can use `pg_dump` to export and Supabase's direct connection to import, since both use the same schema structure.
