import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useApi } from '../lib/useApi.js';
import { money, date, pairs } from '../lib/format.js';
import { StatusBadge } from '../components/Status.jsx';
import Icon from '../components/Icon.jsx';

export default function Account() {
  const { user, ready, logout } = useAuth();
  const { slugs } = useFavorites();
  const navigate = useNavigate();
  const orders = useApi(user ? '/orders/mine' : null);

  if (!ready) return null;
  if (!user) return <Navigate to="/login?next=/account" replace />;

  return (
    <div className="wrap page narrow">
      <section className="profile">
        <span className="avatar" aria-hidden="true">{user.name.trim().charAt(0)}</span>
        <div>
          <h1>{user.name}</h1>
          <p className="muted latin">{user.phone}</p>
        </div>
      </section>

      <nav className="menu-list" aria-label="حسابي">
        <Link to="/favorites"><Icon name="heart" /> المفضلة <span className="muted">{slugs.length || ''}</span><Icon name="forward" size={18} /></Link>
        <Link to="/track"><Icon name="box" /> تتبّع طلب برقمه <span /><Icon name="forward" size={18} /></Link>
        <Link to="/sizes"><Icon name="ruler" /> دليل المقاسات <span /><Icon name="forward" size={18} /></Link>
        {user.role === 'admin' && <Link to="/admin"><Icon name="dashboard" /> لوحة الإدارة <span /><Icon name="forward" size={18} /></Link>}
        <button type="button" onClick={() => { logout(); navigate('/'); }}><Icon name="logout" /> تسجيل الخروج <span /></button>
      </nav>

      <h2 className="section-title">طلباتك</h2>
      {orders.loading && <div className="skeleton" style={{ minHeight: 120 }} />}
      {orders.error && <p className="error">{orders.error.message}</p>}
      {orders.data?.length === 0 && (
        <div className="empty-state compact">
          <p>لم تطلب شيئاً بعد.</p>
          <Link to="/shop" className="btn">تسوّق الأحذية</Link>
        </div>
      )}
      {orders.data?.map(o => (
        <article className="order-card" key={o.id}>
          <header>
            <strong className="latin">{o.code}</strong>
            <StatusBadge status={o.status} />
          </header>
          <div className="order-thumbs">
            {o.items.map((i, n) => i.image && <img key={n} src={i.image} alt="" width="1200" height="900" />)}
          </div>
          <p className="muted">{date(o.created_at)}، {pairs(o.items.reduce((n, i) => n + i.qty, 0))}، {money(o.total)}</p>
        </article>
      ))}
    </div>
  );
}
