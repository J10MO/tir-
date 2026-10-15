import { Link } from 'react-router-dom';
import { money } from '../lib/format.js';
import { useFavorites } from '../context/FavoritesContext.jsx';
import Icon from './Icon.jsx';
import { sizeSummary } from '../lib/sizes.js';

export function FavButton({ slug, name, className = 'fav' }) {
  const fav = useFavorites();
  const on = fav.has(slug);
  return (
    <button
      type="button"
      className={`${className}${on ? ' on' : ''}`}
      aria-pressed={on}
      aria-label={on ? `إزالة ${name} من المفضلة` : `إضافة ${name} إلى المفضلة`}
      onClick={() => fav.toggle(slug)}
    >
      <Icon name="heart" size={20} filled={on} />
    </button>
  );
}

export default function ProductCard({ product }) {
  const [first, second] = product.colors;
  const soldOut = product.total_stock === 0;
  const onSale = product.compare_at_price && !soldOut;
  const fewLeft = !soldOut && product.total_stock <= 8;

  return (
    <article className="card">
      <Link to={`/p/${product.slug}`} className="card-link">
        <div className="tile">
          {first?.image && <img className="primary" src={first.image} alt="" loading="lazy" width="1200" height="900" />}
          {second?.image && <img className="alt" src={second.image} alt="" loading="lazy" width="1200" height="900" />}
          {soldOut && <span className="tag out">نفدت الكمية</span>}
          {onSale && <span className="tag">تخفيض</span>}
          {!onSale && fewLeft && <span className="tag soft">آخر القطع</span>}
        </div>
        <h3>{product.name}</h3>
        <p className="card-price">
          {money(product.price)}
          {product.compare_at_price && <s>{money(product.compare_at_price)}</s>}
        </p>
        <div className="card-meta">
          <span className="dots" aria-label={`الألوان: ${product.colors.map(c => c.name).join('، ')}`}>
            {product.colors.map(c => <i key={c.id} style={{ background: c.hex }} />)}
          </span>
          {product.sizes.length > 0 && <span className="card-sizes"><Icon name="ruler" size={14} /> {sizeSummary(product.sizes)}</span>}
        </div>
      </Link>
      <FavButton slug={product.slug} name={product.name} />
    </article>
  );
}

// Horizontal, swipeable list on phones; a regular grid on wider screens.
export function Rail({ products, label }) {
  return (
    <div className="rail" role="list" aria-label={label}>
      {products.map(p => <div role="listitem" key={p.id}><ProductCard product={p} /></div>)}
    </div>
  );
}
