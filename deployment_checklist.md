# 🚀 Funduq - Production Deployment Checklist

## 1. GitHub Repository (Local)
- [ ] `git init` - Initialize local repository
- [ ] `git add .` - Stage all files (verified `.env*` is in `.gitignore`)
- [ ] `git commit -m "feat: Funduq luxury marketplace — production ready"`
- [ ] Create repository at [github.com/new](https://github.com/new) as `Funduq`
- [ ] `git remote add origin https://github.com/YOUR_USERNAME/Funduq.git`
- [ ] `git branch -M main`
- [ ] `git push -u origin main`

## 2. Vercel Deployment
- [ ] New Project → Import `Funduq`
- [ ] Add Environment Variables (10 total):

| Key | Value (from .env.local) |
|-----|-------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://jftowqfrhhohkqkslfaa.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOi... (anon_key)` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOi... (service_role)` |
| `RESEND_API_KEY` | `re_DjS... (resend_key)` |
| `EMAIL_FROM` | `noreply@funduq.ae` |
| `NEXT_PUBLIC_SITE_URL` | `https://funduq.ae` |
| `SENTRY_DSN` | (Leave blank if not active yet) |
| `SENTRY_ORG` | (From Sentry project) |
| `SENTRY_PROJECT` | (From Sentry project) |
| `SENTRY_AUTH_TOKEN` | (From Sentry settings) |

- [ ] Deploy! 🚀

## 3. Supabase Dashboard
- [ ] **Auth → URL Config**
    - Site URL: `https://funduq.ae`
    - Redirect URL: `https://funduq.ae/auth/callback`
- [ ] **SQL Editor** - Run migrations in order:
    1. `20260326000000_initial_schema.sql`
    2. `005_bookings_and_rls.sql`
    3. `006_admin_moderation.sql`
    4. `007_passport_verification.sql`
    5. `008_fix_profile_roles.sql`
    6. `009_activate_existing_properties.sql`
    7. `010_add_amenities_and_gallery.sql`
    8. `011_signature_collection.sql`
    9. `012_location_country_and_events.sql`
    10. `013_popularity_and_wishlists.sql`
- [ ] **SQL Query** - Grant admin role:
    ```sql
    -- Replace with your production email
    UPDATE profiles SET role = 'admin' WHERE email = '7460201@email.com';
    ```

## 4. Google OAuth (Optional / Polish)
- [ ] Google Cloud Console → Redirect URI:
    - `https://jftowqfrhhohkqkslfaa.supabase.co/auth/v1/callback`
