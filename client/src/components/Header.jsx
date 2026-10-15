import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useApi } from '../lib/useApi.js';
import Icon from './Icon.jsx';

export function Logo({ className = 'brand' }) {
  return (
    <Link to="/" className={className} aria-label="تير، الصفحة الرئيسية">
      <img src="/brand/mark.png" alt="" width="146" height="180" />
    </Link>
  );
}

export default function Header() {
  const { count } = useCart();
  const { user } = useAuth();
  const { slugs } = useFavorites();
  const categories = useApi('/categories');
  const { pathname, search } = useLocation();

  const navClass = path => ({ isActive }) => (isActive && `${pathname}${search}` === path ? 'active' : undefined);

  return (
    <header className="site-head">
      <div className="wrap">
        <Logo />
        <nav className="main-nav" aria-label="الأقسام">
          <NavLink to="/shop" end className={navClass('/shop')}>كل الأحذية</NavLink>
          {(categories.data ?? []).filter(c => c.product_count > 0).map(c => (
            <NavLink key={c.id} to={`/shop?category=${c.slug}`} className={navClass(`/shop?category=${c.slug}`)}>{c.name}</NavLink>
          ))}
          <NavLink to="/track" className={navClass('/track')}>تتبّع طلبك</NavLink>
        </nav>
        <div className="head-tools">
          <Link to="/shop?search=1" className="icon-btn" aria-label="بحث"><Icon name="search" /></Link>
          <Link to="/favorites" className="icon-btn desk-only" aria-label={`المفضلة، ${slugs.length}`}>
            <Icon name="heart" />{slugs.length > 0 && <b className="badge">{slugs.length}</b>}
          </Link>
          <Link to={user ? '/account' : '/login'} className="icon-btn desk-only" aria-label={user ? 'حسابي' : 'تسجيل الدخول'}>
            <Icon name="user" />
          </Link>
          <Link to="/cart" className="icon-btn desk-only" aria-label={`السلة، فيها ${count} قطعة`}>
            <Icon name="bag" />{count > 0 && <b className="badge strong">{count}</b>}
          </Link>
          {user?.role === 'admin' && <Link to="/admin" className="icon-btn" aria-label="لوحة الإدارة"><Icon name="dashboard" /></Link>}
        </div>
      </div>
    </header>
  );
}
