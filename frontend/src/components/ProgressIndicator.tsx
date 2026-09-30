import { Check } from 'lucide-react';
import { cx } from './ui';

export function ProgressIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <nav aria-label="Registration progress">
      <p className="mb-3 text-sm font-semibold text-forest-800 sm:hidden">Step {current + 1} of {steps.length}: {steps[current]}</p>
      <ol className="flex items-center">
        {steps.map((s, i) => {
          const done = i < current, active = i === current;
          return (
            <li key={s} className={cx('flex items-center', i < steps.length - 1 && 'flex-1')} aria-current={active ? 'step' : undefined}>
              <span className="flex flex-col items-center gap-1.5">
                <span className={cx('grid size-9 place-items-center rounded-full text-sm font-bold', done ? 'bg-forest-700 text-cream-50' : active ? 'bg-gold-400 text-forest-950 ring-4 ring-gold-100' : 'bg-cream-200 text-ink-500')}>
                  {done ? <Check className="size-4" aria-label="Completed" /> : i + 1}
                </span>
                <span className={cx('hidden text-xs sm:block', active ? 'font-semibold text-forest-900' : 'text-ink-500')}>{s}</span>
              </span>
              {i < steps.length - 1 && <span className={cx('mx-1.5 h-0.5 flex-1 rounded sm:mb-5', done ? 'bg-forest-700' : 'bg-cream-300')} />}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
