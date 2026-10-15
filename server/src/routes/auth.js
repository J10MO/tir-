import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { query } from '../db.js';
import { handle, HttpError, requireFields, normalizePhone } from '../lib/http.js';
import { signToken, requireUser } from '../lib/auth.js';

const router = Router();

const publicUser = u => ({ id: u.id, name: u.name, phone: u.phone, role: u.role });

router.post('/register', handle(async (req, res) => {
  requireFields(req.body, { name: 'الاسم', phone: 'رقم الهاتف', password: 'كلمة المرور' });
  const phone = normalizePhone(req.body.phone);
  if (String(req.body.password).length < 6) throw new HttpError(400, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل');

  const exists = await query('SELECT 1 FROM users WHERE phone = $1', [phone]);
  if (exists.rowCount) throw new HttpError(409, 'هذا الرقم مسجّل مسبقاً. سجّل الدخول بدلاً من ذلك');

  const hash = await bcrypt.hash(req.body.password, 10);
  const { rows } = await query(
    'INSERT INTO users (name, phone, password_hash) VALUES ($1, $2, $3) RETURNING *',
    [req.body.name.trim(), phone, hash],
  );
  res.status(201).json({ token: signToken(rows[0]), user: publicUser(rows[0]) });
}));

router.post('/login', handle(async (req, res) => {
  requireFields(req.body, { phone: 'رقم الهاتف', password: 'كلمة المرور' });
  const phone = normalizePhone(req.body.phone);
  const { rows } = await query('SELECT * FROM users WHERE phone = $1', [phone]);
  const user = rows[0];
  if (!user || !(await bcrypt.compare(req.body.password, user.password_hash))) {
    throw new HttpError(401, 'رقم الهاتف أو كلمة المرور غير صحيحة');
  }
  res.json({ token: signToken(user), user: publicUser(user) });
}));

router.get('/me', requireUser, handle(async (req, res) => {
  const { rows } = await query('SELECT * FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) throw new HttpError(401, 'انتهت الجلسة. سجّل الدخول من جديد');
  res.json(publicUser(rows[0]));
}));

export default router;
