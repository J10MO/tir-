import { NavLink } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useFavorites } from '../context/FavoritesContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// Bottom navigation shown on phones, like a native shopping app.
export default function TabBar() {
  const { count } = useCart();
  const { slugs } = useFavorites();
  const { user } = useAuth();

  const tabs = [
    { to: '/', label: 'الرئيسية', icon: 'home', end: true },
    { to: '/shop', label: 'تسوّق', icon: 'shop' },
    { to: '/favorites', label: 'المفضلة', icon: 'heart', badge: slugs.length },
    { to: '/cart', label: 'السلة', icon: 'bag', badge: count, strong: true },
    { to: user ? '/account' : '/login', label: 'حسابي', icon: 'user' },
  ];

  return (
    <nav className="tabbar" aria-label="التنقل الرئيسي">
      {tabs.map(t => (
        <NavLink key={t.label} to={t.to} end={t.end} className="tab">
          {({ isActive }) => (
            <>
              <span className="tab-icon">
                <Icon name={t.icon} filled={isActive && t.icon === 'heart'} />
                {t.badge > 0 && <b className={t.strong ? 'badge strong' : 'badge'}>{t.badge}</b>}
              </span>
              <span className="tab-label">{t.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
