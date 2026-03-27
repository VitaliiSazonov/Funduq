import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require authentication
const PROTECTED_PREFIXES = ['/dashboard', '/host', '/guest', '/admin'];
// Routes that authenticated users should be redirected AWAY from
const AUTH_ROUTES = ['/login', '/register'];
// Routes that require admin role specifically
const ADMIN_PREFIXES = ['/admin'];

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ── 1. Protect authenticated routes ──
  // If user is NOT authenticated and tries to access protected routes → redirect to login
  if (!user && PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // ── 2. Admin route guard ──
  // If user IS authenticated but NOT admin → redirect to home (not /login)
  if (user && ADMIN_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/';
      return NextResponse.redirect(url);
    }
  }

  // ── 3. Redirect authenticated users AWAY from auth pages ──
  // If user IS authenticated and visits /login or /register → redirect to role dashboard
  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const role = profile?.role as 'guest' | 'host' | 'admin' | undefined;
    const url = request.nextUrl.clone();

    switch (role) {
      case 'host':
        url.pathname = '/host/dashboard';
        break;
      case 'admin':
        url.pathname = '/admin';
        break;
      case 'guest':
      default:
        url.pathname = '/';
        break;
    }

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
