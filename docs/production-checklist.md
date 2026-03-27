# Funduq — Production Deployment Checklist

> Complete each step in order before going live.

---

## A. Supabase Authentication — URL Configuration

1. Go to **Supabase Dashboard → Authentication → URL Configuration**
2. Set **Site URL** to:
   ```
   https://funduq.com
   ```
3. Add these to **Redirect URLs**:
   ```
   https://funduq.com/auth/callback
   https://funduq.com/**
   ```

> ⚠️ Without this, auth redirects (login, OAuth, password reset) will fail or redirect to localhost.

---

## B. Run Database Migrations

Execute the following migrations **in order** against your production Supabase database.

Go to **Supabase Dashboard → SQL Editor** and run each file:

1. `supabase/migrations/20260326000000_initial_schema.sql`
   - Creates `profiles`, `properties` tables with RLS
2. `supabase/migrations/005_bookings_and_rls.sql`
   - Creates `bookings` table with RLS policies
3. `supabase/migrations/006_admin_moderation.sql`
   - Adds `pending_review` / `suspended` statuses, admin policies

### Verify migrations:

```sql
-- Check all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Expected: bookings, profiles, properties
```

---

## C. Storage Bucket Setup

1. Go to **Supabase Dashboard → Storage**
2. Create bucket: `properties-images`
   - **Public bucket**: ✅ Yes
3. Add RLS policy for uploads:

```sql
-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload property images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'properties-images');

-- Allow public read access
CREATE POLICY "Public read access for property images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'properties-images');

-- Allow owners to delete their images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'properties-images');
```

---

## D. Set Admin User

After your admin account has registered through the normal flow:

```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'YOUR_ADMIN_EMAIL@example.com';
```

Verify:
```sql
SELECT id, email, role FROM profiles WHERE role = 'admin';
```

---

## E. Google OAuth — Production Redirect URI

1. Go to **Google Cloud Console → APIs & Services → Credentials**
2. Edit your OAuth 2.0 Client ID
3. Add **Authorized redirect URI**:
   ```
   https://jftowqfrhhohkqkslfaa.supabase.co/auth/v1/callback
   ```
4. Add **Authorized JavaScript origins**:
   ```
   https://funduq.com
   ```
5. Save changes (may take 5-10 minutes to propagate)

---

## F. Resend — Domain Verification

1. Go to **Resend Dashboard → Domains**
2. Add domain: `funduq.com`
3. Add these DNS records to your domain provider:

| Type  | Name                          | Value                     |
|-------|-------------------------------|---------------------------|
| TXT   | `_resend.funduq.com`          | (provided by Resend)      |
| CNAME | `resend._domainkey.funduq.com`| (provided by Resend)      |
| MX    | `feedback.funduq.com`         | `feedback-smtp.resend.com`|

4. Wait for DNS propagation (up to 48 hours, usually minutes)
5. Click **Verify** in Resend dashboard
6. Update `EMAIL_FROM` in Vercel env vars to `noreply@funduq.com`

---

## G. Vercel Environment Variables

Set these in **Vercel Dashboard → Project → Settings → Environment Variables**:

| Variable                       | Scope             | Notes                          |
|--------------------------------|-------------------|--------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL`     | All environments  | Supabase project URL           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`| All environments  | Public anon key                |
| `SUPABASE_SERVICE_ROLE_KEY`    | Production only   | ⚠️ Server-side only            |
| `RESEND_API_KEY`               | Production only   | From Resend dashboard          |
| `EMAIL_FROM`                   | Production only   | `noreply@funduq.com`           |
| `NEXT_PUBLIC_SITE_URL`         | Per environment   | `https://funduq.com` for prod  |
| `SENTRY_DSN`                   | All environments  | Sentry project DSN             |
| `SENTRY_AUTH_TOKEN`            | Production only   | For source map uploads         |
| `SENTRY_ORG`                   | Production only   | Sentry org slug                |
| `SENTRY_PROJECT`               | Production only   | Sentry project slug            |

---

## H. Post-Deploy Verification

- [ ] Visit `https://funduq.com` — homepage loads
- [ ] `GET /api/test/reset` → returns `403 Forbidden`
- [ ] Property images load from Supabase Storage
- [ ] Register a new account via email
- [ ] Login via Google OAuth completes successfully
- [ ] Create a test property → images upload to Storage
- [ ] Submit a booking request → email notification received
- [ ] Admin panel accessible at `/admin` (admin role only)
- [ ] Check Sentry dashboard for any captured errors
- [ ] Verify security headers via [securityheaders.com](https://securityheaders.com)

---

## I. Ongoing Maintenance

- **Monitor** Sentry for production errors weekly
- **Rotate** `SUPABASE_SERVICE_ROLE_KEY` quarterly via Supabase dashboard
- **Review** Vercel deployment logs after each push
- **Update** dependencies monthly with `npm audit` + `npm update`
