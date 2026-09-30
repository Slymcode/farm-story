import type { Response } from 'express';

export type CsvColumn<T> = { header: string; value: (row: T) => string | number | boolean | Date | null | undefined | string[] };

/** Plain numbers and phone-like strings are safe; anything else that looks like a spreadsheet formula gets a leading apostrophe. */
const SAFE_NUMERIC = /^[+-]?[\d\s().,-]+$/;
export function neutraliseFormula(s: string): string {
  return /^[=+\-@\t\r]/.test(s) && !SAFE_NUMERIC.test(s) ? `'${s}` : s;
}

function cell(v: ReturnType<CsvColumn<unknown>['value']>): string {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (Array.isArray(v)) return escape(neutraliseFormula(v.join('; ')));
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return escape(neutraliseFormula(v));
}
const escape = (s: string) => (/[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** RFC 4180 CSV (CRLF line endings). Excel-friendly BOM is added by sendCsv, not here. */
export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const head = columns.map((c) => escape(c.header)).join(',');
  return [head, ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(','))].join('\r\n') + '\r\n';
}

/** Sends a CSV download. Bypasses the JSON envelope on purpose: a file download is not an API envelope. */
export function sendCsv(res: Response, filenameBase: string, csv: string) {
  const stamp = new Date().toISOString().slice(0, 10);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}-${stamp}.csv"`);
  res.setHeader('Cache-Control', 'no-store');
  res.send('﻿' + csv);
}
