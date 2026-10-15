import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useApi } from '../lib/useApi.js';
import { api } from '../lib/api.js';
import { money } from '../lib/format.js';
import Icon from '../components/Icon.jsx';

export default function Checkout() {
  const cart = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const shipping = useApi('/shipping');
  const [form, setForm] = useState({
    name: user?.name ?? '', phone: user?.phone ?? '', governorate: '', address: '', notes: '',
  });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // Fill in the signed-in customer's details once the session loads.
  useEffect(() => {
    if (user) setForm(f => ({ ...f, name: f.name || user.name, phone: f.phone || user.phone }));
  }, [user]);

  if (!cart.items.length && !busy) return <Navigate to="/cart" replace />;

  const fee = !form.governorate || !shipping.data ? null
    : form.governorate === 'بغداد' ? shipping.data.baghdadFee : shipping.data.otherFee;

  const update = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const order = await api('/orders', {
        method: 'POST',
        body: { customer: form, items: cart.items.map(i => ({ variantId: i.variantId, qty: i.qty })) },
      });
      cart.clear();
      navigate(`/order/${order.code}`, { state: { order }, replace: true });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  return (
    <div className="wrap page">
      <div className="page-head">
        <Link to="/cart" className="round-btn" aria-label="رجوع إلى السلة"><Icon name="back" size={22} /></Link>
        <h1 className="page-title">إتمام الطلب</h1>
      </div>
      <form className="cart-layout" onSubmit={submit}>
        <div className="checkout-steps">
          {!user && (
            <p className="notice">
              عندك حساب؟ <Link to="/login?next=/checkout">سجّل الدخول</Link> لتظهر طلباتك في حسابك، أو أكمل بدون حساب.
            </p>
          )}
          <section className="sheet" aria-labelledby="ship-title">
            <h2 id="ship-title"><Icon name="pin" size={20} /> عنوان التوصيل</h2>
            <div className="form-grid">
              <label className="field">
                <span>الاسم الكامل</span>
                <input required autoComplete="name" value={form.name} onChange={update('name')} />
              </label>
              <label className="field">
                <span>رقم الهاتف</span>
                <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="07XXXXXXXXX" value={form.phone} onChange={update('phone')} />
                <small>سنتصل بك على هذا الرقم لتأكيد الطلب.</small>
              </label>
              <label className="field full">
                <span>المحافظة</span>
                <select required value={form.governorate} onChange={update('governorate')}>
                  <option value="" disabled>اختر المحافظة</option>
                  {(shipping.data?.governorates ?? []).map(g => <option key={g}>{g}</option>)}
                </select>
              </label>
              <label className="field full">
                <span>العنوان</span>
                <textarea required autoComplete="street-address" placeholder="المنطقة، الشارع، أقرب نقطة دالة" value={form.address} onChange={update('address')} />
              </label>
              <label className="field full">
                <span>ملاحظات للمندوب <span className="muted">(اختياري)</span></span>
                <input value={form.notes} onChange={update('notes')} placeholder="مثلاً: اتصل قبل الوصول بنصف ساعة" />
              </label>
            </div>
          </section>

          <section className="sheet" aria-labelledby="pay-title">
            <h2 id="pay-title"><Icon name="cash" size={20} /> طريقة الدفع</h2>
            <div className="pay-option" aria-checked="true" role="radio">
              <span className="radio-dot" aria-hidden="true" />
              <span><b>نقداً عند الاستلام</b>تدفع للمندوب عند وصول طلبك. لا تحتاج بطاقة.</span>
            </div>
          </section>
        </div>

        <aside className="summary" aria-label="ملخص الطلب">
          <h2>طلبك</h2>
          <ul className="mini">
            {cart.items.map(i => (
              <li key={i.variantId}>
                <span className="mini-img">{i.image && <img src={i.image} alt="" width="1200" height="900" />}</span>
                <span className="mini-name">{i.name}<small className="muted">{i.colorName}، مقاس {i.size}{i.qty > 1 && ` × ${i.qty}`}</small></span>
                <span>{money(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="row"><span>المجموع الفرعي</span><span>{money(cart.subtotal)}</span></div>
          <div className="row"><span>التوصيل</span><span>{fee === null ? <span className="muted">اختر المحافظة</span> : money(fee)}</span></div>
          <div className="row total"><span>الإجمالي</span><span>{money(cart.subtotal + (fee ?? 0))}</span></div>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="checkout-bar">
            <div className="buy-bar-price">
              <span className="muted">الإجمالي</span>
              <b>{money(cart.subtotal + (fee ?? 0))}</b>
            </div>
            <button type="submit" className="btn big" disabled={busy}>{busy ? 'جارٍ الإرسال…' : 'تأكيد الطلب'}</button>
          </div>
        </aside>
      </form>
    </div>
  );
}
