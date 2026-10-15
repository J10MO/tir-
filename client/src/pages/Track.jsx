import { useState } from 'react';
import { api } from '../lib/api.js';
import { money, date } from '../lib/format.js';
import { Timeline } from '../components/Status.jsx';

export default function Track() {
  const [code, setCode] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError(''); setOrder(null);
    try {
      setOrder(await api(`/orders/track?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phone)}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap receipt">
      <h1>تتبّع طلبك</h1>
      <p className="muted" style={{ marginTop: 8 }}>اكتب رقم الطلب الذي ظهر لك بعد الطلب، ورقم الهاتف الذي استخدمته.</p>
      <form onSubmit={submit} style={{ display: 'grid', gap: 16, marginTop: 24 }}>
        <div className="form-grid">
          <label className="field">
            <span>رقم الطلب</span>
            <input required className="ltr" placeholder="TIR-XXXXXX" value={code} onChange={e => setCode(e.target.value)} />
          </label>
          <label className="field">
            <span>رقم الهاتف</span>
            <input required type="tel" placeholder="07XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} />
          </label>
        </div>
        <button className="btn big block" disabled={busy}>{busy ? 'جارٍ البحث…' : 'اعرض حالة الطلب'}</button>
        {error && <p className="error" role="alert">{error}</p>}
      </form>

      {order && (
        <section style={{ marginTop: 40 }} aria-live="polite">
          <h2 style={{ fontSize: 'var(--t-xl)' }}>الطلب <span className="latin">{order.code}</span></h2>
          <p className="muted">{date(order.created_at)}</p>
          <Timeline status={order.status} />
          <ul className="items-list">
            {order.items.map((i, n) => (
              <li key={n}><span>{i.product_name}، {i.color_name}، مقاس {i.size} {i.qty > 1 && `× ${i.qty}`}</span><span>{money(i.unit_price * i.qty)}</span></li>
            ))}
            <li><strong>الإجمالي مع التوصيل</strong><strong>{money(order.total)}</strong></li>
          </ul>
        </section>
      )}
    </div>
  );
}
