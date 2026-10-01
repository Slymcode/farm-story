import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { TextField } from '@/components/form';
import { Button } from '@/components/ui';
import { AuthShell, linkClass } from './AuthShell';

const schema = z.object({
  name: z.string().trim().min(1, 'Please enter your full name.').max(120, 'Please use a shorter name.'),
  email: z.string().trim().min(1, 'Please enter a valid email address.').pipe(z.email('Please enter a valid email address.')),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(72, 'Password must be 72 characters or fewer.'),
  confirmPassword: z.string().min(1, 'Please confirm your password.'),
}).refine((v) => v.password === v.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match.' });
type Values = z.infer<typeof schema>;

export default function Signup() {
  const { register: createAccount } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { name: '', email: '', password: '', confirmPassword: '' } });

  const submit = handleSubmit(async ({ name, email, password }) => {
    setServerError(null);
    try {
      // On success the session is set and GuestOnly moves the farmer straight into the existing onboarding flow.
      await createAccount({ name, email, password });
    } catch (e) {
      if (e instanceof ApiError && e.details?.length) e.details.forEach((d) => d.field in schema.shape && setError(d.field as keyof Values, { message: d.message }));
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    }
  });

  return (
    <AuthShell title="Create your account" subtitle="It takes a minute. Then we'll set up your farm together."
      footer={<>Already have an account? <Link to="/login" className={linkClass}>Log in</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4" aria-label="Create account">
        <TextField label="Full name" autoComplete="name" placeholder="e.g. John Mwangi" error={errors.name?.message} {...register('name')} />
        <TextField label="Email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <TextField label="Password" type="password" autoComplete="new-password" hint="At least 8 characters." error={errors.password?.message} {...register('password')} />
        <TextField label="Confirm password" type="password" autoComplete="new-password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        {serverError && <p role="alert" className="rounded-xl bg-danger-100 p-3.5 font-medium text-danger-700">{serverError}</p>}
        <Button type="submit" className="w-full" icon={UserPlus} loading={isSubmitting}>{isSubmitting ? 'Creating account…' : 'Create account'}</Button>
      </form>
    </AuthShell>
  );
}
