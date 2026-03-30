import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPostAuthRedirect } from '@/app/actions/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');
  const type = searchParams.get('type');

  console.log('[Funduq Auth Callback] Received callback:', {
    hasCode: !!code,
    next,
    type,
    origin,
    url: request.url,
  });

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      console.error('[Funduq Auth Callback] exchangeCodeForSession error:', {
        message: error.message,
        status: error.status,
        name: error.name,
      });
    }

    if (!error) {
      // ── Password recovery flow → send to update-password page ──
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/update-password`);
      }

      // If a `next` param was provided, use it; otherwise route by role
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const redirectPath = await getPostAuthRedirect();
      console.log('[Funduq Auth Callback] Success, redirecting to:', redirectPath);
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  } else {
    console.error('[Funduq Auth Callback] No code received. Search params:', Object.fromEntries(searchParams.entries()));
  }

  // Auth error — redirect to login with error state
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
