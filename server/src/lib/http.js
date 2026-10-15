export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Wraps an async route so thrown errors reach the error handler.
export const handle = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

export function requireFields(body, fields) {
  for (const [key, label] of Object.entries(fields)) {
    const v = body?.[key];
    if (v === undefined || v === null || String(v).trim() === '') {
      throw new HttpError(400, `${label} مطلوب`);
    }
  }
}

// Iraqi mobile numbers: 07XXXXXXXXX (11 digits). Accepts +964 / 964 prefixes.
export function normalizePhone(raw) {
  const digits = String(raw ?? '').replace(/[^\d]/g, '').replace(/^(00)?964/, '0');
  if (!/^07\d{9}$/.test(digits)) throw new HttpError(400, 'رقم الهاتف غير صحيح. اكتبه بصيغة 07XXXXXXXXX');
  return digits;
}

export function slugify(text) {
  const s = String(text).trim().toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '');
  return s || `item-${Date.now()}`;
}
