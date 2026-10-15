import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { ProductGrid } from './Home.jsx';
import Icon from '../components/Icon.jsx';
import { useChildSize } from '../context/ChildSizeContext.jsx';

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const size = params.get('size') || '';
  const sort = params.get('sort') || 'new';
  const q = params.get('q') || '';
  const [text, setText] = useState(q);
  const searchRef = useRef(null);
  const { size: childSize } = useChildSize();

  const categories = useApi('/categories');
  const everything = useApi('/products');
  const query = new URLSearchParams(Object.entries({ category, size, sort, q }).filter(([, v]) => v)).toString();
  const products = useApi(`/products?${query}`);

  const set = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    next.delete('search');
    setParams(next, { replace: true });
  };

  // Arriving from a search button focuses the box straight away.
  useEffect(() => { if (params.get('search')) searchRef.current?.focus(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Search as you type, after a short pause.
  useEffect(() => {
    const t = setTimeout(() => { if (text.trim() !== q) set('q', text.trim()); }, 350);
    return () => clearTimeout(t);
  }, [text]); // eslint-disable-line react-hooks/exhaustive-deps

  const sizes = [...new Set((everything.data ?? []).flatMap(p => p.sizes))].sort((a, b) => a - b);
  const cats = (categories.data ?? []).filter(c => c.product_count > 0);
  const current = cats.find(c => c.slug === category);
  const title = q ? `نتائج «${q}»` : current ? current.name : 'كل الأحذية';
  const filtered = category || size || q;

  return (
    <div className="wrap page">
      <form className="search-box" role="search" onSubmit={e => { e.preventDefault(); set('q', text.trim()); }}>
        <Icon name="search" size={20} />
        <input ref={searchRef} type="search" value={text} onChange={e => setText(e.target.value)}
          placeholder="ابحث عن حذاء، لون، أو موديل" aria-label="بحث في الأحذية" enterKeyHint="search" />
        {text && <button type="button" className="clear" aria-label="مسح البحث" onClick={() => { setText(''); set('q', ''); }}><Icon name="close" size={18} /></button>}
      </form>

      <nav className="chip-row" aria-label="الأقسام">
        <button type="button" className="chip" aria-pressed={!category} onClick={() => set('category', '')}>الكل</button>
        {cats.map(c => (
          <button key={c.id} type="button" className="chip" aria-pressed={category === c.slug} onClick={() => set('category', c.slug)}>{c.name}</button>
        ))}
      </nav>

      <div className="shop-bar">
        <h1>{title} {products.data && <span className="muted">({products.data.length})</span>}</h1>
        <div className="selects">
          <label className="select">
            <span className="sr">الترتيب</span>
            <select value={sort} onChange={e => set('sort', e.target.value)}>
              <option value="new">الأحدث</option>
              <option value="price_asc">الأرخص أولاً</option>
              <option value="price_desc">الأغلى أولاً</option>
            </select>
          </label>
        </div>
      </div>

      <div className="size-chips" role="group" aria-label="المقاس">
        <span className="size-chips-label"><Icon name="ruler" size={18} /> المقاس</span>
        <button type="button" className="chip small" aria-pressed={!size} onClick={() => set('size', '')}>الكل</button>
        {childSize && (
          <button type="button" className="chip small mine" aria-pressed={size === String(childSize)} onClick={() => set('size', String(childSize))}>
            مقاس طفلي {childSize}
          </button>
        )}
        {sizes.map(s => (
          <button key={s} type="button" className="chip small" aria-pressed={size === String(s)} onClick={() => set('size', size === String(s) ? '' : String(s))}>{s}</button>
        ))}
        <Link to="/sizes" className="chip small ghost-link">ما مقاس طفلي؟</Link>
      </div>

      {products.data && !products.data.length ? (
        <div className="empty-state">
          <Icon name="search" size={40} />
          <h2>لا يوجد موديل بهذه المواصفات</h2>
          <p>جرّب مقاساً آخر أو كلمة بحث مختلفة.</p>
          {filtered && <Link to="/shop" className="btn ghost" onClick={() => setText('')}>عرض كل الأحذية</Link>}
        </div>
      ) : <ProductGrid state={products} />}
    </div>
  );
}
