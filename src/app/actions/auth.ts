'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { sendEmail } from '@/lib/email/sendEmail';
import WelcomeEmail from '@/lib/email/templates/WelcomeEmail';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type AuthResult = {
  success: boolean;
  error?: string;
  message?: string;
  redirectTo?: string;
};

type UserRole = 'guest' | 'host' | 'admin';

// ─────────────────────────────────────────────────────────────
// Post-Auth Role Routing
// ─────────────────────────────────────────────────────────────
export async function getPostAuthRedirect(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return '/login';

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const role = (profile?.role as UserRole) ?? 'guest';

  switch (role) {
    case 'host':
      return '/host/dashboard';
    case 'admin':
      return '/admin';
    case 'guest':
    default:
      return '/';
  }
}

// ─────────────────────────────────────────────────────────────
// Sign Up
// ─────────────────────────────────────────────────────────────
export async function signUpAction(formData: {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  role: UserRole;
}): Promise<AuthResult> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          role: formData.role,
          full_name: formData.fullName,
          phone: formData.phone,
        },
      },
    });

    if (error) {
      console.error('[Funduq Auth] SignUp error:', error.message, error);
      return {
        success: false,
        error: friendlyAuthError(error.message),
      };
    }

    // Profile is created automatically by the DB trigger (handle_new_user).
    // We only send the welcome email here.
    if (data.user) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const firstName = formData.fullName.split(' ')[0] || 'there';
      void sendEmail({
        to: formData.email,
        subject: 'Welcome to Funduq',
        react: WelcomeEmail({
          firstName,
          role: formData.role as 'guest' | 'host',
          baseUrl,
        }),
      });
    }

    const redirectTo = await getPostAuthRedirect();
    
    return {
      success: true,
      message: 'Account created successfully! Welcome to Funduq.',
      redirectTo,
    };
  } catch (err) {
    console.error('[Funduq Auth] Unexpected signup error:', err);
    return {
      success: false,
      error: 'Something went wrong. Please try again.',
    };
  }
}

// ─────────────────────────────────────────────────────────────
// Sign In
// ─────────────────────────────────────────────────────────────
export async function signInAction(formData: {
  email: string;
  password: string;
}): Promise<AuthResult & { redirectTo?: string }> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.email,
    password: formData.password,
  });

  if (error) {
    return {
      success: false,
      error: friendlyAuthError(error.message),
    };
  }

  const redirectTo = await getPostAuthRedirect();

  return {
    success: true,
    redirectTo,
  };
}

// ─────────────────────────────────────────────────────────────
// Sign Out
// ─────────────────────────────────────────────────────────────
export async function signOutAction(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/');
}

// ─────────────────────────────────────────────────────────────
// Password Reset — Send Email
// ─────────────────────────────────────────────────────────────
export async function resetPasswordAction(email: string): Promise<AuthResult> {
  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?type=recovery`,
  });

  if (error) {
    return {
      success: false,
      error: friendlyAuthError(error.message),
    };
  }

  return {
    success: true,
    message: 'Password reset link sent! Check your email inbox.',
  };
}

// ─────────────────────────────────────────────────────────────
// Password Update — After clicking reset link
// ─────────────────────────────────────────────────────────────
export async function updatePasswordAction(
  newPassword: string
): Promise<AuthResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return {
      success: false,
      error: friendlyAuthError(error.message),
    };
  }

  return {
    success: true,
    message: 'Password updated successfully!',
  };
}

// ─────────────────────────────────────────────────────────────
// Google OAuth — get redirect URL
// ─────────────────────────────────────────────────────────────
export async function signInWithGoogleAction(): Promise<
  AuthResult & { url?: string }
> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`,
    },
  });

  if (error) {
    return {
      success: false,
      error: friendlyAuthError(error.message),
    };
  }

  return {
    success: true,
    url: data.url,
  };
}

// ─────────────────────────────────────────────────────────────
// User-friendly error message mapper
// ─────────────────────────────────────────────────────────────
function friendlyAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes('invalid login credentials'))
    return 'Incorrect email or password. Please try again.';
  if (lower.includes('email not confirmed'))
    return 'Authentication failed. Please check your credentials or contact support.';
  if (lower.includes('user already registered'))
    return 'An account with this email already exists. Try signing in instead.';
  if (lower.includes('signup is disabled'))
    return 'Registration is currently disabled. Please try again later.';
  if (lower.includes('email rate limit exceeded'))
    return 'Too many requests. Please wait a few minutes and try again.';
  if (lower.includes('password'))
    return 'Password must be at least 8 characters long.';
  if (lower.includes('rate limit'))
    return 'Too many attempts. Please wait a moment and try again.';

  return 'Something went wrong. Please try again.';
}
