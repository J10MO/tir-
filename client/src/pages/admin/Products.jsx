import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApi } from '../../lib/useApi.js';
import { money } from '../../lib/format.js';

export default function Products() {
  const [q, setQ] = useState('');
  const { data, error, loading } = useApi(`/admin/products${q ? `?q=${encodeURIComponent(q)}` : ''}`);
  const navigate = useNavigate();

  return (
    <>
      <div className="admin-bar">
        <h1>المنتجات</h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <input type="search" className="search" placeholder="ابحث باسم المنتج" aria-label="بحث في المنتجات"
            onKeyDown={e => e.key === 'Enter' && setQ(e.currentTarget.value.trim())} />
          <Link to="/admin/products/new" className="btn">إضافة منتج</Link>
        </div>
      </div>

      {loading && <div className="skeleton" />}
      {error && <p className="error">{error.message}</p>}
      {data && !data.length && (
        <div className="notice">
          <p>لا توجد منتجات بعد. أضف أول حذاء ليظهر في المتجر.</p>
        </div>
      )}
      {data?.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>الصورة</th><th>الاسم</th><th>القسم</th><th>السعر</th><th>الألوان</th><th>المخزون</th><th>الحالة</th></tr></thead>
            <tbody>
              {data.map(p => (
                <tr key={p.id} className="clickable" onClick={() => navigate(`/admin/products/${p.id}`)}>
                  <td>{p.colors[0]?.image && <img src={p.colors[0].image} alt="" className="thumb" />}</td>
                  <td><Link to={`/admin/products/${p.id}`}>{p.name}</Link>{p.is_featured && <span className="muted"> (مميّز)</span>}</td>
                  <td>{p.category_name ?? 'بدون قسم'}</td>
                  <td className="num">{money(p.price)}</td>
                  <td><span className="dots">{p.colors.map(c => <i key={c.id} style={{ background: c.hex }} title={c.name} />)}</span></td>
                  <td className={`num${p.total_stock === 0 ? ' low' : ''}`}>{p.total_stock === 0 ? 'نفد' : `${p.total_stock} زوج`}</td>
                  <td>{p.is_active ? 'معروض' : <span className="muted">مخفي</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
