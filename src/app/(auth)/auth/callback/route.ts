import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPostAuthRedirect } from '@/app/actions/auth';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If a `next` param was provided, use it; otherwise route by role
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      const redirectPath = await getPostAuthRedirect();
      return NextResponse.redirect(`${origin}${redirectPath}`);
    }
  }

  // Auth error — redirect to login with error state
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
