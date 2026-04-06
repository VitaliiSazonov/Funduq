'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { resetPasswordAction } from '@/app/actions/auth';

export default function ResetPasswordPage() {
  const t = useTranslations('resetPassword');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const resetSchema = z.object({
    email: z.string().email(t('emailValidation')),
  });
  type ResetFormValues = z.infer<typeof resetSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ResetFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    const result = await resetPasswordAction(values.email);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || t('checkEmail'));
    } else {
      setServerError(result.error || t('somethingWrong'));
    }
  }

  if (successMessage) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md text-center"
      >
        <div className="bg-white rounded-3xl border border-charcoal/5 shadow-luxury p-10">
          <div className="w-16 h-16 mx-auto mb-6 gold-gradient rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black display-font text-charcoal mb-3">
            {t('emailSent')}
          </h1>
          <p className="text-charcoal/50 text-sm leading-relaxed mb-6">
            {successMessage}
          </p>
          <Link
            href="/login"
            className="inline-block px-8 py-3 gold-gradient text-white rounded-xl font-semibold hover:opacity-90 transition-opacity text-sm"
          >
            {t('backToSignIn')}
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-3xl border border-charcoal/5 shadow-luxury p-8 md:p-10">
        <Link
          href="/login"
          className="flex items-center gap-1.5 text-sm text-charcoal/40 hover:text-charcoal transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('backToSignIn')}
        </Link>

        <div className="text-center mb-8">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-gold mb-2 block">
            {t('passwordRecovery')}
          </span>
          <h1 className="text-2xl font-black display-font text-charcoal">
            {t('resetYourPassword')}
          </h1>
          <p className="text-charcoal/40 text-sm mt-2">
            {t('enterEmail')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
              {t('emailAddress')}
            </label>
            <input
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              data-testid="reset-email"
              className="w-full px-4 py-3.5 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1.5">{errors.email.message}</p>
            )}
          </div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center"
              data-testid="reset-error"
            >
              {serverError}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="reset-submit"
            className="w-full py-3.5 gold-gradient text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('sending')}
              </>
            ) : (
              t('sendResetLink')
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
