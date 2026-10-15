import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { api } from '../../lib/api.js';
import { money, date, pairs, STATUS, STATUS_ACTION } from '../../lib/format.js';
import { StatusBadge } from '../../components/Status.jsx';

export function Orders() {
  const [params, setParams] = useSearchParams();
  const status = params.get('status') || '';
  const q = params.get('q') || '';
  const navigate = useNavigate();
  const qs = new URLSearchParams(Object.entries({ status, q }).filter(([, v]) => v)).toString();
  const { data, error, loading } = useApi(`/admin/orders?${qs}`);

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <>
      <div className="admin-bar">
        <h1>الطلبات</h1>
        <input type="search" className="search" placeholder="ابحث برقم الطلب أو الهاتف أو الاسم" defaultValue={q}
          onKeyDown={e => e.key === 'Enter' && set('q', e.currentTarget.value.trim())} aria-label="بحث في الطلبات" />
      </div>
      <div className="chips" role="group" aria-label="تصفية حسب الحالة" style={{ marginBottom: 20 }}>
        <button type="button" className="chip" aria-pressed={!status} onClick={() => set('status', '')}>الكل</button>
        {Object.entries(STATUS).map(([k, label]) => (
          <button key={k} type="button" className="chip" aria-pressed={status === k} onClick={() => set('status', k)}>{label}</button>
        ))}
      </div>

      {loading && <div className="skeleton" />}
      {error && <p className="error">{error.message}</p>}
      {data && !data.length && <p className="notice muted">لا توجد طلبات بهذه الحالة.</p>}
      {data?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>رقم الطلب</th><th>التاريخ</th><th>الزبون</th><th>الهاتف</th><th>المحافظة</th><th>الأزواج</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
            <tbody>
              {data.map(o => (
                <tr key={o.id} className="clickable" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                  <td><Link to={`/admin/orders/${o.id}`} className="latin">{o.code}</Link></td>
                  <td>{date(o.created_at)}</td>
                  <td>{o.customer_name}</td>
                  <td className="latin">{o.phone}</td>
                  <td>{o.governorate}</td>
                  <td className="num">{o.pairs}</td>
                  <td className="num">{money(o.total)}</td>
                  <td><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const { data: order, error, loading, setData } = useApi(`/admin/orders/${id}`);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  async function move(status) {
    if (status === 'cancelled' && !window.confirm('إلغاء الطلب سيعيد الأزواج إلى المخزون. هل تريد الإلغاء؟')) return;
    setBusy(true); setActionError('');
    try {
      setData(await api(`/admin/orders/${id}`, { method: 'PATCH', body: { status } }));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="skeleton" />;
  if (error) return <p className="error">{error.message}</p>;

  const count = order.items.reduce((n, i) => n + i.qty, 0);

  return (
    <>
      <p className="muted"><Link to="/admin/orders">الطلبات</Link> / <span className="latin">{order.code}</span></p>
      <div className="admin-bar" style={{ marginTop: 8 }}>
        <h1>الطلب <span className="latin">{order.code}</span> <StatusBadge status={order.status} /></h1>
        <span className="muted">{date(order.created_at)}</span>
      </div>

      <div className="order-detail">
        <section>
          <h2>{pairs(count)}</h2>
          <div className="table-wrap">
            <table>
              <thead><tr><th>المنتج</th><th>اللون</th><th>المقاس</th><th>الكمية</th><th>السعر</th></tr></thead>
              <tbody>
                {order.items.map((i, n) => (
                  <tr key={n}>
                    <td>{i.image && <img src={i.image} alt="" className="thumb" style={{ display: 'inline-block', verticalAlign: 'middle', marginInlineEnd: 10 }} />}{i.product_name}</td>
                    <td>{i.color_name}</td>
                    <td className="num">{i.size}</td>
                    <td className="num">{i.qty}</td>
                    <td className="num">{money(i.unit_price * i.qty)}</td>
                  </tr>
                ))}
                <tr><td colSpan={4}>التوصيل إلى {order.governorate}</td><td className="num">{money(order.delivery_fee)}</td></tr>
                <tr><td colSpan={4}><strong>يُستلم من الزبون</strong></td><td className="num"><strong>{money(order.total)}</strong></td></tr>
              </tbody>
            </table>
          </div>
        </section>

        <div style={{ display: 'grid', gap: 20 }}>
          <section className="panel">
            <h2 style={{ margin: 0 }}>الزبون</h2>
            <dl>
              <dt>الاسم</dt><dd>{order.customer_name}</dd>
              <dt>الهاتف</dt><dd><a href={`tel:${order.phone}`} className="latin">{order.phone}</a></dd>
              <dt>المحافظة</dt><dd>{order.governorate}</dd>
              <dt>العنوان</dt><dd>{order.address}</dd>
              {order.notes && <><dt>ملاحظات</dt><dd>{order.notes}</dd></>}
            </dl>
          </section>

          {order.next.length > 0 && (
            <section className="panel">
              <h2 style={{ margin: 0 }}>الخطوة التالية</h2>
              <div className="actions-row">
                {order.next.map(s => (
                  <button key={s} type="button" disabled={busy} onClick={() => move(s)}
                    className={s === 'cancelled' ? 'btn danger' : 'btn'}>{STATUS_ACTION[s]}</button>
                ))}
              </div>
              {actionError && <p className="error" role="alert">{actionError}</p>}
            </section>
          )}
        </div>
      </div>
    </>
  );
}
