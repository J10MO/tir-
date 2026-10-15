import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const AuthLogo = () => <img className="auth-logo" src="/brand/logo.png" alt="تير" width="280" height="178" />;

function useNext() {
  const [params] = useSearchParams();
  const next = params.get('next');
  return next && next.startsWith('/') && !next.startsWith('//') ? next : null;
}

export function Login() {
  const auth = useAuth();
  const navigate = useNavigate();
  const next = useNext();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (auth.user) return <Navigate to={next || '/account'} replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const user = await auth.login(phone, password);
      navigate(next || (user.role === 'admin' ? '/admin' : '/account'), { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="wrap auth" onSubmit={submit}>
      <AuthLogo />
      <h1>تسجيل الدخول</h1>
      <label className="field">
        <span>رقم الهاتف</span>
        <input required type="tel" autoComplete="tel" placeholder="07XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
      </label>
      <label className="field">
        <span>كلمة المرور</span>
        <input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} />
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn big block" disabled={busy}>{busy ? 'جارٍ الدخول…' : 'دخول'}</button>
      <p className="muted">ليس عندك حساب؟ <Link to={`/register${next ? `?next=${encodeURIComponent(next)}` : ''}`}>أنشئ حساباً</Link></p>
    </form>
  );
}

export function Register() {
  const auth = useAuth();
  const navigate = useNavigate();
  const next = useNext();
  const [form, setForm] = useState({ name: '', phone: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (auth.user) return <Navigate to={next || '/account'} replace />;

  const update = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await auth.register(form.name, form.phone, form.password);
      navigate(next || '/account', { replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <form className="wrap auth" onSubmit={submit}>
      <AuthLogo />
      <h1>إنشاء حساب</h1>
      <p className="muted">بحسابك تتابع كل طلباتك في مكان واحد، ونملأ عنوانك تلقائياً في الطلب القادم.</p>
      <label className="field">
        <span>الاسم</span>
        <input required autoComplete="name" value={form.name} onChange={update('name')} />
      </label>
      <label className="field">
        <span>رقم الهاتف</span>
        <input required type="tel" autoComplete="tel" placeholder="07XXXXXXXXX" value={form.phone} onChange={update('phone')} />
      </label>
      <label className="field">
        <span>كلمة المرور</span>
        <input required type="password" autoComplete="new-password" minLength={6} value={form.password} onChange={update('password')} />
        <small>6 أحرف على الأقل.</small>
      </label>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="btn big block" disabled={busy}>{busy ? 'جارٍ إنشاء الحساب…' : 'إنشاء الحساب'}</button>
      <p className="muted">عندك حساب؟ <Link to={`/login${next ? `?next=${encodeURIComponent(next)}` : ''}`}>سجّل الدخول</Link></p>
    </form>
  );
}
