'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { updatePasswordAction } from '@/app/actions/auth';

export default function UpdatePasswordPage() {
  const t = useTranslations('updatePassword');
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const updatePasswordSchema = z
    .object({
      password: z.string().min(8, t('passwordMin')),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t('passwordsNoMatch'),
      path: ['confirmPassword'],
    });

  type UpdatePasswordFormValues = z.infer<typeof updatePasswordSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  async function onSubmit(values: UpdatePasswordFormValues) {
    setIsSubmitting(true);
    setServerError(null);

    const result = await updatePasswordAction(values.password);
    setIsSubmitting(false);

    if (result.success) {
      setSuccessMessage(result.message || t('passwordUpdated'));
      setTimeout(() => {
        router.push('/login');
      }, 2000);
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
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black display-font text-charcoal mb-3">
            {t('passwordUpdated')}
          </h1>
          <p className="text-charcoal/50 text-sm leading-relaxed">
            {successMessage} {t('redirecting')}
          </p>
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
        <div className="text-center mb-8">
          <span className="text-xs font-black uppercase tracking-[0.25em] text-gold mb-2 block">
            {t('almostDone')}
          </span>
          <h1 className="text-2xl font-black display-font text-charcoal">
            {t('setNewPassword')}
          </h1>
          <p className="text-charcoal/40 text-sm mt-2">
            {t('enterNewPassword')}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div>
            <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
              {t('newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('password')}
                placeholder={t('passwordPlaceholder')}
                data-testid="update-password"
                className="w-full px-4 py-3.5 pr-12 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal/60 transition-colors cursor-pointer"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-xs mt-1.5">{errors.password.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-charcoal/70 mb-2 uppercase tracking-wider">
              {t('confirmNewPassword')}
            </label>
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword')}
                placeholder={t('confirmPlaceholder')}
                data-testid="update-confirm-password"
                className="w-full px-4 py-3.5 pr-12 bg-offwhite border border-charcoal/10 rounded-xl text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-charcoal/30 hover:text-charcoal/60 transition-colors cursor-pointer"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
              >
                {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1.5">{errors.confirmPassword.message}</p>
            )}
          </div>

          {serverError && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center"
              data-testid="update-error"
            >
              {serverError}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            data-testid="update-submit"
            className="w-full py-3.5 gold-gradient text-white rounded-xl font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('updating')}
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {t('updatePassword')}
              </>
            )}
          </button>
        </form>
      </div>
    </motion.div>
  );
}
