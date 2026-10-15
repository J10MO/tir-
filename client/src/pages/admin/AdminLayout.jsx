import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Logo } from '../../components/Header.jsx';
import '../../styles/admin.css';

export default function AdminLayout() {
  const { user, ready, logout } = useAuth();
  const { pathname } = useLocation();

  if (!ready) return null;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(pathname)}`} replace />;
  if (user.role !== 'admin') {
    return (
      <div className="wrap empty">
        <p>هذه الصفحة لإدارة المتجر فقط.</p>
        <Link to="/" className="btn ghost">العودة إلى المتجر</Link>
      </div>
    );
  }

  return (
    <div className="admin">
      <aside className="admin-side">
        <Logo />
        <nav aria-label="الإدارة">
          <NavLink to="/admin" end>نظرة عامة</NavLink>
          <NavLink to="/admin/orders">الطلبات</NavLink>
          <NavLink to="/admin/products">المنتجات</NavLink>
        </nav>
        <div className="foot">
          <Link to="/">عرض المتجر</Link>
          <button type="button" className="link-btn" onClick={logout}>تسجيل الخروج</button>
        </div>
      </aside>
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
