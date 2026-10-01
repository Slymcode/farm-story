import { useEffect, useState } from 'react';

/** QR code for a URL, rendered client-side (no external service, nothing about the farm leaves the browser). */
export function PassportQr({ url, size = 176 }: { url: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    import('qrcode').then((m) => m.toDataURL(url, { margin: 1, width: size * 2, color: { dark: '#16301f', light: '#ffffff' } })).then((d) => live && setSrc(d)).catch(() => live && setSrc(null));
    return () => { live = false; };
  }, [url, size]);
  return src
    ? <img src={src} width={size} height={size} alt="QR code that opens this Farm Passport" className="rounded-xl bg-white p-2 ring-1 ring-cream-300" />
    : <div style={{ width: size, height: size }} className="grid place-items-center rounded-xl bg-white text-xs text-ink-500 ring-1 ring-cream-300">QR code</div>;
}
