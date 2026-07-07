# CampusPass — Campus Event Ticketing Platform

A ready-to-deploy campus event booking & ticketing platform:

- **Public site (React)** — browse events, book tickets, pay with M-Pesa (STK push), receive a QR ticket by email.
- **Backend (Node/Express + MongoDB)** — auth with email OTP, M-Pesa Daraja integration, Gmail-powered emails.
- **Hidden admin dashboard** — not linked anywhere on the public site, reachable only at a secret URL you choose, with 20+ features: revenue & ticket-sales graphs, payment breakdown, users table, transactions log + CSV export, event manager, ticket check-in, notifications (in-app/email), OTP & activity logs, leaderboard, live sessions, settings, and admin-account management.

This zip contains **no real secrets**. You must plug in your own credentials before it will work — see below.

---

## 1. What you need before you start

| Credential | Where to get it |
|---|---|
| MongoDB connection string | [MongoDB Atlas](https://cloud.mongodb.com) → create a free cluster → Database → Connect → Drivers |
| Gmail address + App Password | Turn on 2-Step Verification on the Gmail account, then generate a 16-character App Password at https://myaccount.google.com/apppasswords |
| M-Pesa Daraja production credentials | https://developer.safaricom.co.ke → My Apps → your production app: Consumer Key, Consumer Secret, Shortcode (till/paybill), PartyB, Passkey |
| A domain/host for the backend | e.g. Render, Railway, a VPS — must be reachable over **HTTPS** for M-Pesa callbacks to work |
| A domain/host for the frontend | e.g. Vercel, Netlify, or served as static files from any host |

---

## 2. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

Open `.env` and fill in every value — see the comments in the file for exactly where each one comes from:
`MONGODB_URI`, `JWT_SECRET`/`ADMIN_JWT_SECRET` (generate with `openssl rand -hex 32`), `GMAIL_USER`/`GMAIL_APP_PASSWORD`,
`MPESA_*` variables, and `ADMIN_ROUTE_SLUG` (pick your own secret slug — this becomes part of your hidden admin URL).

Run locally:

```bash
npm run dev
```

Deploy (Render/Railway/VPS): set the same variables as environment variables on your host, and set the start command to `npm start`.

**Important:** once deployed, `MPESA_CALLBACK_URL` in your `.env` must be the real public HTTPS URL of this backend,
e.g. `https://api.yourdomain.com/api/mpesa/callback`. Safaricom will POST payment results to that URL.

### Create your first admin login

Admin accounts live in the `admins` MongoDB collection, never in a text file. After deploying, run this once
(from your server console, or locally pointed at your production `MONGODB_URI`):

```bash
npm run seed:admin -- "Your Name" "you@example.com" "a-strong-password"
```

This creates a `superadmin`. Once logged in, you can create more admins from the **Admins** tab in the dashboard.

---

## 3. Frontend setup

```bash
cd frontend
npm install
cp .env.example .env
```

Set `VITE_API_URL` to your deployed backend's API base (e.g. `https://api.yourdomain.com/api`), and set
`VITE_ADMIN_ROUTE_SLUG` to the **exact same** slug you chose in the backend's `ADMIN_ROUTE_SLUG`.

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

This outputs static files in `frontend/dist/` — deploy that folder to Vercel, Netlify, or any static host.
If your host needs a rewrite rule for client-side routing (React Router), add a catch-all rewrite to `index.html`.

---

## 4. Finding your hidden admin dashboard

The admin dashboard is **not linked anywhere** in the public site's navigation or sitemap. It only exists at:

```
https://yourdomain.com/<ADMIN_ROUTE_SLUG>
```

using whatever slug you set in both `.env` files (default placeholder: `control-9f2a71` — **change this** before
going live). Bookmark it; there's no public link to it.

---

## 5. Registering the M-Pesa callback URL

On the Safaricom Daraja portal, make sure the callback/confirmation URL registered for your shortcode matches
`MPESA_CALLBACK_URL` in your backend `.env` exactly, and that it's reachable over HTTPS with a valid certificate —
Safaricom will not deliver callbacks to plain HTTP or self-signed endpoints.

---

## 6. What's new: images, links, themes, event managers, transaction tools

**Event extras** (Events tab): each event can now have a gallery of image URLs (paste links from
Imgur/Cloudinary/Drive/etc — there's no file upload pipeline wired up, just URL fields), an optional
external link button, and an optional per-event accent color.

**Editable site text & theme** (Settings tab): site name, homepage headline/subtitle, footer text, and
the three theme colors (ink/gold/paper) are now editable from the dashboard and apply instantly to the
public site — no redeploy needed. A few one-click presets are included, including a green-and-gold
"DeKUT-inspired" option (tweak the exact shades yourself if you want a closer match — we don't have
DeKUT's official brand hex codes on hand).

**Event managers** (Events tab → "Get link"): generates a private, unauthenticated link
(`/#/manage/<token>`) scoped to one event. Whoever holds that link can view that event's ticket
counts and check tickets in — they can't see any other event, and there's no separate login to manage.
Treat the link itself as the credential; regenerating it invalidates the old one.

**Transactions** (Transactions tab, and a preview on Overview): filterable by status, event, date range,
phone/receipt search, and min/max amount (7 filters total). A "Delete old failed (14d+)" button
bulk-removes non-successful transactions older than two weeks — successful ones are never touched.

**Stale-event reminder**: once an event is more than 30 days past its end date, a banner appears on
Overview and Events suggesting cleanup. Nothing is deleted automatically — it's a nudge, not an
automatic sweep.

**More reliable ticket emails**: QR codes are now generated at higher resolution and error-correction,
and the email always shows the ticket code as readable text too, so check-in still works even if the
QR image doesn't render in someone's inbox.

## 7. What's inside

```
backend/
  server.js              entry point
  config/db.js           MongoDB connection
  models/                User, Admin, Event, Ticket, Transaction, OtpLog, Notification, ActivityLog
  controllers/            business logic (auth, events, tickets/payments, admin auth, notifications, dashboard analytics)
  routes/                 Express routes
  middleware/             JWT auth guards (user + admin), activity logging
  utils/                  Gmail mailer + templates, M-Pesa STK push client, OTP/ticket-code/JWT helpers
  scripts/seedAdmin.js    creates the first admin login

frontend/
  src/pages/              public site: Home, EventDetail (booking + STK push polling), Login, Register, VerifyOtp, MyTickets
  src/admin/              hidden dashboard: layout/sidebar + 12 sections covering 20+ features
  src/context/            auth state for users and admins (separate tokens)
  src/styles/theme.css    design tokens (the "ticket stub" visual language used throughout)
```

---

## 8. Security notes

- Admin passwords are bcrypt-hashed in MongoDB — never stored in plaintext.
- User and admin sessions use **separate** JWT secrets, so one can never impersonate the other.
- Rate limiting is applied to login/OTP endpoints to slow down brute-force attempts.
- Rotate `JWT_SECRET`/`ADMIN_JWT_SECRET` and your Gmail App Password if you ever suspect they've leaked.
- Never commit your real `.env` files to git or share them — only `.env.example` files with placeholders are included here.
