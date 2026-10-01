import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { CheckCircle2, LogIn } from 'lucide-react';
import { ApiError } from '@/api/client';
import { useAuth } from '@/auth/AuthContext';
import { TextField } from '@/components/form';
import { Button } from '@/components/ui';
import { AuthShell, linkClass } from './AuthShell';

const schema = z.object({
  email: z.string().trim().min(1, 'Please enter a valid email address.').pipe(z.email('Please enter a valid email address.')),
  password: z.string().min(1, 'Please enter your password.'),
});
type Values = z.infer<typeof schema>;

export default function Login() {
  const { login, loggedOut } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema), mode: 'onTouched', defaultValues: { email: '', password: '' } });

  const submit = handleSubmit(async (v) => {
    setServerError(null);
    try {
      await login(v); // GuestOnly then sends them on: unfinished onboarding → Continue Onboarding, otherwise the dashboard
    } catch (e) {
      setServerError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    }
  });

  return (
    <AuthShell title="Welcome back" subtitle="Log in to continue with your farm."
      footer={<>New to Farm Story? <Link to="/signup" className={linkClass}>Create an account</Link></>}>
      {loggedOut && <p role="status" className="mb-4 flex items-center gap-2 rounded-xl bg-forest-100 p-3.5 font-medium text-forest-800"><CheckCircle2 className="size-5 shrink-0" aria-hidden />You've been logged out.</p>}
      <form onSubmit={submit} noValidate className="space-y-4" aria-label="Log in">
        <TextField label="Email" type="email" inputMode="email" autoComplete="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
        <TextField label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register('password')} />
        {serverError && <p role="alert" className="rounded-xl bg-danger-100 p-3.5 font-medium text-danger-700">{serverError}</p>}
        <Button type="submit" className="w-full" icon={LogIn} loading={isSubmitting}>{isSubmitting ? 'Logging in…' : 'Log in'}</Button>
      </form>
    </AuthShell>
  );
}
