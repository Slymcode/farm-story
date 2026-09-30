import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { cx } from './ui';

const control = 'w-full min-h-12 rounded-xl border bg-white px-4 text-base text-ink-900 placeholder:text-ink-500/70 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/30';

interface FieldProps { label: string; hint?: string; error?: string; optional?: boolean; children: (p: { id: string; describedBy?: string; invalid: boolean }) => ReactNode }
/** Label + control + hint + error wiring (aria-describedby / aria-invalid) shared by every form control. */
export function Field({ label, hint, error, optional, children }: FieldProps) {
  const id = useId();
  const describedBy = [hint && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-[0.95rem] font-semibold text-forest-900">{label}{optional && <span className="ml-1.5 font-normal text-ink-500">(optional)</span>}</label>
      {children({ id, describedBy, invalid: !!error })}
      {hint && !error && <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-500">{hint}</p>}
      {error && <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-danger-700">{error}</p>}
    </div>
  );
}

type TextProps = InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string; optional?: boolean };
export const TextField = forwardRef<HTMLInputElement, TextProps>(function TextField({ label, hint, error, optional, className, ...rest }, ref) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional}>
      {({ id, describedBy, invalid }) => <input ref={ref} id={id} aria-describedby={describedBy} aria-invalid={invalid} className={cx(control, invalid ? 'border-danger-700' : 'border-cream-300', className)} {...rest} />}
    </Field>
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string; error?: string; optional?: boolean; options: (string | { value: string; label: string })[]; placeholder?: string };
export const SelectField = forwardRef<HTMLSelectElement, SelectProps>(function SelectField({ label, hint, error, optional, options, placeholder, className, ...rest }, ref) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional}>
      {({ id, describedBy, invalid }) => (
        <select ref={ref} id={id} aria-describedby={describedBy} aria-invalid={invalid} className={cx(control, invalid ? 'border-danger-700' : 'border-cream-300', className)} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      )}
    </Field>
  );
});

type AreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string; error?: string; optional?: boolean };
export const TextAreaField = forwardRef<HTMLTextAreaElement, AreaProps>(function TextAreaField({ label, hint, error, optional, className, ...rest }, ref) {
  return (
    <Field label={label} hint={hint} error={error} optional={optional}>
      {({ id, describedBy, invalid }) => <textarea ref={ref} id={id} aria-describedby={describedBy} aria-invalid={invalid} rows={3} className={cx(control, 'py-3', invalid ? 'border-danger-700' : 'border-cream-300', className)} {...rest} />}
    </Field>
  );
});
