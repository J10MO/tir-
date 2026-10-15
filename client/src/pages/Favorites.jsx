import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { useFavorites } from '../context/FavoritesContext.jsx';
import ProductCard from '../components/ProductCard.jsx';
import Icon from '../components/Icon.jsx';

export default function Favorites() {
  const { slugs } = useFavorites();
  const all = useApi('/products');
  const items = (all.data ?? []).filter(p => slugs.includes(p.slug))
    .sort((a, b) => slugs.indexOf(a.slug) - slugs.indexOf(b.slug));

  return (
    <div className="wrap page">
      <h1 className="page-title">المفضلة</h1>
      {!slugs.length ? (
        <div className="empty-state">
          <Icon name="heart" size={40} />
          <h2>لا شيء في المفضلة بعد</h2>
          <p>اضغط على القلب فوق أي حذاء لتحفظه هنا وترجع له لاحقاً.</p>
          <Link to="/shop" className="btn">تصفّح الأحذية</Link>
        </div>
      ) : all.loading ? (
        <div className="grid">{slugs.map(s => <div key={s} className="skeleton tile-skel" />)}</div>
      ) : (
        <div className="grid">{items.map(p => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  );
}
