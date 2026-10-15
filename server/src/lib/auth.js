import jwt from 'jsonwebtoken';
import { HttpError } from './http.js';

const hosted = process.env.RENDER || process.env.NODE_ENV === 'production';
if (!process.env.JWT_SECRET && hosted) {
  console.error("JWT_SECRET is not set. Add it to the host environment variables (any long random string).");
  process.exit(1);
}
if (!process.env.JWT_SECRET) console.warn('JWT_SECRET is not set; using an insecure development secret.');
const SECRET = process.env.JWT_SECRET || 'dev-only-secret';

export const signToken = user => jwt.sign({ id: user.id, role: user.role, name: user.name }, SECRET, { expiresIn: '30d' });

// Attaches req.user when a valid token is present; never rejects.
export function readUser(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try { req.user = jwt.verify(token, SECRET); } catch { /* treat as signed out */ }
  }
  next();
}

export function requireUser(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'سجّل الدخول للمتابعة'));
  next();
}

export function requireAdmin(req, _res, next) {
  if (!req.user) return next(new HttpError(401, 'سجّل الدخول للمتابعة'));
  if (req.user.role !== 'admin') return next(new HttpError(403, 'هذه الصفحة للإدارة فقط'));
  next();
}
