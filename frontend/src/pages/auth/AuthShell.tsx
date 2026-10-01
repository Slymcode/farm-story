import type { ReactNode } from 'react';
import { Card } from '@/components/ui';

/** Shared frame for login / sign-up so both feel like the rest of Farm Story. */
export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle: string; children: ReactNode; footer: ReactNode }) {
  return (
    <div className="mx-auto max-w-md pt-2 sm:pt-8">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-lg text-ink-700">{subtitle}</p>
      </div>
      <Card className="p-5 sm:p-7">{children}</Card>
      <p className="mt-5 text-center text-ink-700">{footer}</p>
    </div>
  );
}

export const linkClass = 'font-semibold text-forest-700 underline underline-offset-2 hover:text-forest-900';
