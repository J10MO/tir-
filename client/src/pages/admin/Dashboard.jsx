import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { money, date } from '../../lib/format.js';
import { StatusBadge } from '../../components/Status.jsx';

export default function Dashboard() {
  const { data, error, loading } = useApi('/admin/stats');
  const navigate = useNavigate();

  if (loading) return <div className="skeleton" />;
  if (error) return <p className="error">{error.message}</p>;

  return (
    <>
      <div className="admin-bar"><h1>نظرة عامة</h1></div>

      <div className="figures">
        <div className={data.new_orders ? 'attention' : undefined}>
          <Link to="/admin/orders?status=new"><b>{data.new_orders}</b><span>طلبات جديدة تنتظر الاتصال</span></Link>
        </div>
        <div><b>{data.in_progress}</b><span>قيد التوصيل أو التأكيد</span></div>
        <div><b>{data.month_orders}</b><span>طلبات هذا الشهر</span></div>
        <div><b>{money(data.month_revenue)}</b><span>مبيعات مُسلّمة هذا الشهر</span></div>
      </div>

      <div className="two-col">
        <section>
          <h2>آخر الطلبات</h2>
          {data.recent.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>رقم الطلب</th><th>الزبون</th><th>المحافظة</th><th>الإجمالي</th><th>الحالة</th></tr></thead>
                <tbody>
                  {data.recent.map(o => (
                    <tr key={o.id} className="clickable" onClick={() => navigate(`/admin/orders/${o.id}`)}>
                      <td><Link to={`/admin/orders/${o.id}`} className="latin">{o.code}</Link><br /><span className="muted">{date(o.created_at)}</span></td>
                      <td>{o.customer_name}</td>
                      <td>{o.governorate}</td>
                      <td className="num">{money(o.total)}</td>
                      <td><StatusBadge status={o.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="notice muted">لا توجد طلبات بعد. ستظهر هنا فور وصول أول طلب.</p>}
        </section>

        <section>
          <h2>مقاسات قاربت على النفاد</h2>
          {data.lowStock.length ? (
            <div className="table-wrap">
              <table>
                <thead><tr><th>المنتج</th><th>المقاس</th><th>المتبقي</th></tr></thead>
                <tbody>
                  {data.lowStock.map((s, i) => (
                    <tr key={i} className="clickable" onClick={() => navigate(`/admin/products/${s.product_id}`)}>
                      <td>{s.name}<br /><span className="muted">{s.color_name}</span></td>
                      <td className="num">{s.size}</td>
                      <td className={`num${s.stock === 0 ? ' low' : ''}`}>{s.stock === 0 ? 'نفد' : s.stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="notice muted">كل المقاسات متوفرة بكمية جيدة.</p>}
        </section>
      </div>
    </>
  );
}
