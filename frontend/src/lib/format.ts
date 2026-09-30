export const num = (n: number | null | undefined, digits = 0) => (n == null ? '—' : n.toLocaleString('en-KE', { maximumFractionDigits: digits }));
export const kg = (n: number | null | undefined) => (n == null ? '—' : `${num(n)} kg`);
export const date = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const initials = (full: string) => full.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');
