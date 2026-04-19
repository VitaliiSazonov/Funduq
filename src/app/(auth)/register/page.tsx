'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Loader2,
  Building2,
  Palmtree,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { signUpAction } from '@/app/actions/auth';

type RegisterFormValues = {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
};
type UserRole = 'guest' | 'host';

// ─────────────────────────────────────────────────────────────
// Animation Variants
// ─────────────────────────────────────────────────────────────
const fadeSlide = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function RegisterPage() {
  const t = useTranslations('register');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  // ─── Schema (with translated messages) ───
  const registerSchema = z
    .object({
      fullName: z
        .string()
        .min(2, t('fullNameMin'))
        .max(80, t('fullNameMax')),
      email: z.string().email(t('emailValidation')),
      phone: z
        .string()
        .regex(
          /^\+971\s?\d{2}\s?\d{3}\s?\d{4}$/,
          t('phoneValidation')
        )
        .or(z.literal('')),
      password: z.string().min(8, t('passwordMin')),
      confirmPassword: z.string(),
      agreeToTerms: z.boolean().refine((val) => val === true, {
        message: t('termsRequired'),
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordsNoMatch'),
      path: ['confirmPassword'],
    });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      phone: '+971 ',
      password: '',
      confirmPassword: '',
      agreeToTerms: undefined,
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    if (!selectedRole) return;

    setIsSubmitting(true);
    setServerError(null);

    const result = await signUpAction({
      email: values.email,
      password: values.password,
      fullName: values.fullName,
      phone: values.phone,
      role: selectedRole,
    });

    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || 'Success');
      // Give the user a moment to see the success state or just redirect
      setTimeout(() => {
        if (result.redirectTo) {
          router.push(result.redirectTo);
          router.refresh();
        }
      }, 1500);
    } else {
      setServerError(result.error || t('somethingWrong'));
    }
  }

  // ─── Success State ───
  if (successMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-white rounded-3xl border border-charcoal/5 shadow-luxury p-10">
          <div className="w-16 h-16 mx-auto mb-6 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
          <h1
            className="text-2xl font-black display-font text-charcoal mb-3"
            data-testid="register-success-heading"
          >
            {t('welcomeBack').replace('{name}', '')}
          </h1>
          <p className="text-charcoal/50 text-sm leading-relaxed mb-6">
            {successMessage}
          </p>
          <div className="flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gold" />
          </div>
        </div>
      </motion.div>
    );
  }

  // ─── Role Selection ───
  if (!selectedRole) {
    return (
      <motion.div
        {...fadeSlide}
        className="w-full max-w-lg"
      >
        <div className="text-center mb-10">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-gold mb-2 block">
            {t('joinFunduq')}
          </span>
          <h1 className="text-3xl md:text-4xl font-black display-font text-charcoal">
            {t('howWillYouUse')}
          </h1>
          <p className="text-charcoal/40 text-sm mt-3">
            {t('choosePath')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Guest Card */}
          <button
            type="button"
            onClick={() => setSelectedRole('guest')}
            data-testid="role-guest"
            className="group relative bg-white rounded-2xl border-2 border-charcoal/5 p-8 text-center hover:border-gold hover:shadow-luxury transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 mx-auto mb-5 bg-gold/10 rounded-2xl flex items-center justify-center group-hover:bg-gold/20 transition-colors duration-300">
              <Palmtree className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-lg font-bold display-font text-charcoal mb-2">
              {t('lookingForVilla')}
            </h3>
            <p className="text-sm text-charcoal/40 leading-relaxed">
              {t('browseAndBook')}
            </p>
            <div className="absolute top-4 right-4 w-5 h-5 border-2 border-charcoal/10 rounded-full group-hover:border-gold group-hover:bg-gold/10 transition-all duration-300" />
          </button>

          {/* Host Card */}
          <button
            type="button"
            onClick={() => setSelectedRole('host')}
            data-testid="role-host"
            className="group relative bg-white rounded-2xl border-2 border-charcoal/5 p-8 text-center hover:border-gold hover:shadow-luxury transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 mx-auto mb-5 bg-gold/10 rounded-2xl flex items-center justify-center group-hover:bg-gold/20 transition-colors duration-300">
              <Building2 className="w-7 h-7 text-gold" />
            </div>
            <h3 className="text-lg font-bold display-font text-charcoal mb-2">
              {t('wantToListProperty')}
            </h3>
            <p className="text-sm text-charcoal/40 leading-relaxed">
              {t('showcaseProperty')}
            </p>
            <div className="absolute top-4 right-4 w-5 h-5 border-2 border-charcoal/10 rounded-full group-hover:border-gold group-hover:bg-gold/10 transition-all duration-300" />
          </button>
        </div>

        <p className="text-center mt-8 text-sm text-charcoal/40">
          {t('alreadyHaveAccount')}{' '}
          <Link
            href="/login"
            className="text-gold font-semibold hover:underline"
          >
            {t('signIn')}
          </Link>
        </p>
      </motion.div>
    );
  }

  // ─── Registration Form ───
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="register-form"
        {...fadeSlide}
        className="w-full max-w-md"
      >
        <div className="bg-white rounded-3xl border border-charcoal/5 shadow-luxury p-8 md:p-10">
          {/* Back to role selection */}
          <button
            type="button"
            onClick={() => {
              setSelectedRole(null);
              setServerError(null);
            }}
            className="flex items-center gap-1.5 text-sm text-charcoal/40 hover:text-charcoal transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('changeRole')}
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gold/10 rounded-full mb-4">
              {selectedRole === 'guest' ? (
                <Palmtree className="w-4 h-4 text-gold" />
              ) : (
                <Building2 className="w-4 h-4 text-gold" />
              )}
              <span className="text-xs font-bold text-gold-dark uppercase tracking-wider">
                {selectedRole === 'guest' ? t('guestAccount') : t('hostAccount')}
              </span>
            </div>
            <h1
              className="text-2xl font-black display-font text-charcoal"
              data-testid="register-heading"
            >
              {t('createYourAccount')}
            </h1>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-5"
            noValidate
          >
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                {t('fullName')}
              </label>
              <input
                {...register('fullName')}
                placeholder={t('fullNamePlaceholder')}
                data-testid="register-fullname"
                className="w-full px-4 py-3.5 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
              {errors.fullName && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.fullName.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                {t('email')}
              </label>
              <input
                type="email"
                {...register('email')}
                placeholder="you@example.com"
                data-testid="register-email"
                className="w-full px-4 py-3.5 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                {t('phone')} <span className="text-charcoal/30 normal-case">{t('phoneUae')}</span>
              </label>
              <input
                type="tel"
                {...register('phone')}
                placeholder="+971 50 123 4567"
                data-testid="register-phone"
                className="w-full px-4 py-3.5 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                {t('password')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  placeholder={t('passwordPlaceholder')}
                  data-testid="register-password"
                  className="w-full px-4 py-3.5 pr-12 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal/60 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
                {t('confirmPassword')}
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  {...register('confirmPassword')}
                  placeholder={t('confirmPasswordPlaceholder')}
                  data-testid="register-confirm-password"
                  className="w-full px-4 py-3.5 pr-12 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal/60 transition-colors cursor-pointer"
                  aria-label={
                    showConfirm ? 'Hide password' : 'Show password'
                  }
                >
                  {showConfirm ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1.5">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                {...register('agreeToTerms')}
                id="agreeToTerms"
                data-testid="register-terms"
                className="mt-1 w-4 h-4 rounded border-charcoal/20 text-gold focus:ring-gold/40 cursor-pointer accent-gold"
              />
              <label
                htmlFor="agreeToTerms"
                className="text-sm text-charcoal/60 leading-relaxed cursor-pointer"
              >
                {t('agreeToTerms')}{' '}
                <span className="text-gold font-semibold hover:underline">
                  {t('termsOfService')}
                </span>{' '}
                &{' '}
                <span className="text-gold font-semibold hover:underline">
                  {t('privacyPolicy')}
                </span>
              </label>
            </div>
            {errors.agreeToTerms && (
              <p className="text-red-500 text-xs -mt-2">
                {errors.agreeToTerms.message}
              </p>
            )}

            {/* Server Error */}
            {serverError && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center"
                data-testid="register-error"
              >
                {serverError}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              data-testid="register-submit"
              className="w-full py-3.5 gold-gradient text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('creatingAccount')}
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  {t('createAccount')}
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <p className="text-center mt-6 text-sm text-charcoal/40">
            {t('alreadyHaveAccount')}{' '}
            <Link
              href="/login"
              className="text-gold font-semibold hover:underline"
            >
              {t('signIn')}
            </Link>
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
