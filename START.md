# ⚠️ HOW TO RUN — READ THIS FIRST

This is a **Next.js web application**. You CANNOT open the files directly in a browser.
You MUST run it with Node.js. Here's how:

---

## 🚀 Quick Start (3 steps)

### Step 1 — Install Node.js
Download from: https://nodejs.org (LTS version recommended)

### Step 2 — Install dependencies
Open a terminal / command prompt in this folder and run:
```
npm install
```

### Step 3 — Start the app
```
npm run dev
```

Then open your browser and go to: **http://localhost:3000**

---

## 🔑 Default Login
- **Admin Password:** `admin`

---

## ⚙️ First-time Setup (Supabase Database)
Edit `.env.local` and fill in your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```
Then run the SQL in `supabase-schema.sql` in your Supabase SQL Editor.

Without Supabase, the app still works but data won't be saved between restarts.

---

## 🔧 Common Issues
- **Blank/unstyled page?** → You opened the files directly. Use `npm run dev` instead.
- **Port already in use?** → Run `npm run dev -- -p 3001` to use port 3001.
- **npm not found?** → Install Node.js first (Step 1 above).
