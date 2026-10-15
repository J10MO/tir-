import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import Icon from './Icon.jsx';

export const INSTAGRAM = 'https://www.instagram.com/tir.fashion.iq/';

export default function Footer() {
  const categories = useApi('/categories');
  return (
    <footer className="site-foot">
      <div className="wrap">
        <div className="foot-brand">
          <img src="/brand/logo.png" alt="تير. Ancient threads, modern weaves" width="280" height="178" loading="lazy" />
          <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="foot-insta">
            <Icon name="insta" size={20} /> <span className="latin">@tir.fashion.iq</span>
          </a>
        </div>
        <nav aria-label="روابط المتجر">
          <h3>تسوّق</h3>
          <ul>
            <li><Link to="/shop">كل الأحذية</Link></li>
            {(categories.data ?? []).filter(c => c.product_count > 0).map(c => (
              <li key={c.id}><Link to={`/shop?category=${c.slug}`}>{c.name}</Link></li>
            ))}
          </ul>
        </nav>
        <nav aria-label="المساعدة">
          <h3>المساعدة</h3>
          <ul>
            <li><Link to="/sizes">دليل المقاسات</Link></li>
            <li><Link to="/track">تتبّع طلبك</Link></li>
            <li><Link to="/favorites">المفضلة</Link></li>
            <li>الدفع نقداً عند الاستلام</li>
            <li>تبديل المقاس خلال 7 أيام</li>
          </ul>
        </nav>
        <p className="legal">© {new Date().getFullYear()} تير. <span className="latin">Ancient threads, modern weaves.</span></p>
      </div>
    </footer>
  );
}
