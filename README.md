# Funduq

A modern short-term rental marketplace built for the GCC market.
Connects property owners (hosts) with guests — without payment processing on the platform.
Guests pay owners directly after booking is confirmed.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database & Auth | Supabase (PostgreSQL + Row Level Security) |
| Styling | Tailwind CSS |
| Internationalization | next-intl (English / Russian) |
| Email | Resend |
| Error Monitoring | Sentry |
| Deployment | Vercel |
| Airbnb Import | Apify API |
| Calendar Sync | iCal (node-ical) |

## User Roles

| Role | Description |
|---|---|
| `guest` | Browse properties, make booking requests, manage profile & wishlist |
| `host` | Create and manage property listings, handle bookings, import from Airbnb |
| `admin` | Moderate properties, verify passport documents, view all users and bookings |

## Key Features

- 🔍 Property catalog with filters (location, bedrooms, type, events)
- 📅 Booking flow: request → host confirm/decline → contact reveal
- 🛂 Guest passport verification with admin approval
- 🏠 Host listing wizard with Airbnb import and iCal sync
- 🌐 Full EN/RU localization
- 📧 Transactional emails for all key events
- 🔒 Role-based access control via middleware

## Getting Started

### 1. Clone and install

```
git clone https://github.com/your-org/funduq.git
cd funduq
npm install
```

### 2. Configure environment

```
cp .env.example .env.local
```

Fill in all values in `.env.local`. See `.env.example` for descriptions of each variable.

### 3. Run development server

```
npm run dev
```

Open http://localhost:3000.

## Environment Variables

See `.env.example` for the full list. Key variables:

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public anon key
- `SUPABASE_SERVICE_ROLE_KEY` — server-only service role key
- `RESEND_API_KEY` — for transactional emails
- `APIFY_API_TOKEN` — for Airbnb listing import (optional, fallback available)
- `CRON_SECRET` — protects scheduled job endpoints
- `SENTRY_DSN` — error monitoring

## Database

Migrations are located in `supabase/migrations/`. A combined file `production_all_migrations.sql` is available for manual execution via Supabase Dashboard.

## Deployment

Deployed on Vercel. Connect your GitHub repository and set environment variables in the Vercel project settings.
