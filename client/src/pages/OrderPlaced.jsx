import { Link, useLocation, useParams } from 'react-router-dom';
import { money } from '../lib/format.js';
import { Timeline } from '../components/Status.jsx';
import Icon from '../components/Icon.jsx';

export default function OrderPlaced() {
  const { code } = useParams();
  const order = useLocation().state?.order;

  return (
    <div className="wrap receipt">
      <span className="success-icon"><Icon name="check" size={36} /></span>
      <h1>وصلنا طلبك</h1>
      <p className="muted" style={{ marginTop: 8 }}>سنتصل بك خلال 24 ساعة على الرقم {order?.phone && <span className="latin">{order.phone}</span>} لتأكيد الطلب وموعد التوصيل.</p>

      <div className="code">
        <span>رقم الطلب</span>
        <b>{code}</b>
      </div>
      <p className="muted">احتفظ بهذا الرقم. تستطيع تتبّع طلبك به مع رقم هاتفك من صفحة <Link to="/track">تتبّع طلبك</Link>.</p>

      {order && (
        <>
          <Timeline status={order.status} />
          <ul className="items-list">
            {order.items.map((i, n) => (
              <li key={n}><span>{i.product_name}، {i.color_name}، مقاس {i.size} {i.qty > 1 && `× ${i.qty}`}</span><span>{money(i.unit_price * i.qty)}</span></li>
            ))}
            <li><span>التوصيل إلى {order.governorate}</span><span>{money(order.delivery_fee)}</span></li>
            <li><strong>تدفع عند الاستلام</strong><strong>{money(order.total)}</strong></li>
          </ul>
        </>
      )}

      <div style={{ marginTop: 32 }}><Link to="/shop" className="btn block">أكمل التسوّق</Link></div>
    </div>
  );
}
