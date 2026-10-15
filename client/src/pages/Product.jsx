import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { money, footCm } from '../lib/format.js';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import SizeStrip from '../components/SizeStrip.jsx';
import { FavButton, Rail } from '../components/ProductCard.jsx';
import Icon from '../components/Icon.jsx';
import SizeGuide from '../components/SizeGuide.jsx';
import { ageFor, sizeSummary } from '../lib/sizes.js';

export default function Product() {
  const { slug } = useParams();
  const { data: product, error, loading } = useApi(`/products/${slug}`);
  const others = useApi(product ? '/products' : null);
  const cart = useCart();
  const toast = useToast();
  const navigate = useNavigate();
  const sizesRef = useRef(null);

  const [colorId, setColorId] = useState(null);
  const [variantId, setVariantId] = useState(null);
  const [message, setMessage] = useState('');
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    if (product) { setColorId(product.colors[0]?.id ?? null); setVariantId(null); setMessage(''); }
  }, [product]);

  useEffect(() => { if (product) document.title = `${product.name} | تير`; }, [product]);

  if (loading) return <div className="wrap pdp"><div className="skeleton pdp-skel" /></div>;
  if (error) {
    return (
      <div className="wrap empty-state">
        <Icon name="box" size={40} />
        <h1>{error.status === 404 ? 'هذا الحذاء غير متوفر' : 'تعذّر تحميل الصفحة'}</h1>
        <p>{error.message}</p>
        <Link to="/shop" className="btn">تصفّح الأحذية</Link>
      </div>
    );
  }

  const color = product.colors.find(c => c.id === colorId) ?? product.colors[0];
  const variant = color?.variants.find(v => v.id === variantId);
  const allOut = color?.variants.every(v => v.stock === 0);

  function pickColor(id) {
    const next = product.colors.find(c => c.id === id);
    // Keep the chosen size when switching colour, if it's in stock.
    const same = next.variants.find(v => v.size === variant?.size && v.stock > 0);
    setColorId(id);
    setVariantId(same?.id ?? null);
  }

  function addToCart() {
    if (!variant) {
      setMessage('اختر المقاس أولاً.');
      sizesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      sizesRef.current?.querySelector('input:not(:disabled)')?.focus({ preventScroll: true });
      return;
    }
    cart.add({
      variantId: variant.id, slug: product.slug, name: product.name, colorName: color.name,
      size: variant.size, price: product.price, image: color.images[0], qty: 1, stock: variant.stock,
    });
    setMessage('');
    toast(`أُضيف ${product.name} مقاس ${variant.size} إلى السلة`, { to: '/cart', label: 'عرض السلة' });
  }

  async function share() {
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: `${product.name} | تير`, url });
      else { await navigator.clipboard.writeText(url); toast('نُسخ رابط الحذاء'); }
    } catch { /* closed the share sheet */ }
  }

  const outSizes = color.variants.filter(v => v.stock === 0).map(v => v.size);
  const inSizes = color.variants.filter(v => v.stock > 0).map(v => v.size);
  let stockNote = `المتوفر: ${sizeSummary(inSizes) || 'لا شيء'}${outSizes.length ? `. نفد: ${outSizes.join('، ')}` : ''}`;
  if (variant) {
    stockNote = variant.stock <= 2
      ? `بقي ${variant.stock === 1 ? 'زوج واحد' : 'زوجان'} فقط من مقاس ${variant.size}`
      : `مقاس ${variant.size} يناسب قدماً طولها حتى ${footCm(variant.size)} سم، عمر ${ageFor(variant.size) ?? 'غير محدد'} تقريباً`;
  }

  const related = (others.data ?? [])
    .filter(p => p.id !== product.id)
    .sort((a, b) => (b.category_slug === product.category_slug) - (a.category_slug === product.category_slug))
    .slice(0, 6);

  return (
    <div className="pdp-page">
      <div className="wrap pdp">
        <section className="pdp-media" aria-label="صورة الحذاء">
          <div className="pdp-photo">
            {color.images[0] && <img key={color.images[0]} src={color.images[0]} alt={`${product.name}، ${color.name}`} width="1200" height="900" />}
          </div>
          <div className="photo-tools">
            <button type="button" className="round-btn" onClick={() => (window.history.length > 1 ? navigate(-1) : navigate('/shop'))} aria-label="رجوع">
              <Icon name="back" size={22} />
            </button>
            <span className="spacer" />
            <button type="button" className="round-btn" onClick={share} aria-label="مشاركة الحذاء"><Icon name="share" size={20} /></button>
            <FavButton slug={product.slug} name={product.name} className="round-btn" />
          </div>
          {product.colors.length > 1 && (
            <div className="color-thumbs" role="group" aria-label="صور الألوان">
              {product.colors.map(c => (
                <button key={c.id} type="button" aria-pressed={c.id === color.id} onClick={() => pickColor(c.id)} aria-label={c.name}>
                  <img src={c.images[0]} alt="" width="1200" height="900" />
                </button>
              ))}
            </div>
          )}
        </section>

        <div className="pdp-info">
          <p className="crumbs">
            <Link to="/shop">الأحذية</Link>
            {product.category_slug && <> / <Link to={`/shop?category=${product.category_slug}`}>{product.category_name}</Link></>}
          </p>
          <div className="pdp-title">
            <h1>{product.name}</h1>
            <p className="pdp-price">
              {money(product.price)}
              {product.compare_at_price && <s>{money(product.compare_at_price)}</s>}
            </p>
          </div>

          <fieldset className="pick">
            <legend>اللون <span className="muted">{color.name}</span></legend>
            <div className="swatches">
              {product.colors.map(c => (
                <label className="swatch" key={c.id}>
                  <input type="radio" name="color" checked={c.id === color.id} onChange={() => pickColor(c.id)} aria-label={c.name} />
                  <span style={{ background: c.hex }} />
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset className="pick" ref={sizesRef}>
            <legend>المقاس <span className="muted">أوروبي، وتحته طول القدم بالسنتيمتر</span></legend>
            <SizeStrip variants={color.variants} value={variantId} onChange={id => { setVariantId(id); setMessage(''); }} />
            <div className="pick-foot">
              <p className={`stock-note${variant && variant.stock <= 2 ? ' low' : ''}`} aria-live="polite">{stockNote}</p>
              <button type="button" className="guide-link" onClick={() => setGuide(true)}><Icon name="ruler" size={18} /> دليل المقاسات</button>
            </div>
            {message && <p className="error" role="alert">{message}</p>}
          </fieldset>

          <div className="buy-bar">
            <div className="buy-bar-price">
              <span className="muted">{variant ? `مقاس ${variant.size}` : 'السعر'}</span>
              <b>{money(product.price)}</b>
            </div>
            <button type="button" className="btn big" disabled={allOut} onClick={addToCart}>
              <Icon name="bag" size={20} />
              {allOut ? 'نفد هذا اللون' : 'أضف إلى السلة'}
            </button>
          </div>

          <div className="accordion">
            {product.description && (
              <details open>
                <summary>عن الحذاء</summary>
                <p>{product.description}</p>
              </details>
            )}
            <details>
              <summary>كيف أختار المقاس؟</summary>
              <p>قف على ورقة وكعبك ملاصق للحائط، وضع علامة عند طرف أطول إصبع، ثم قس المسافة من الحائط إلى العلامة. اختر المقاس الذي رقمه بالسنتيمتر يساوي قياسك أو أكبر منه بقليل.</p>
            </details>
            <details>
              <summary>التوصيل والدفع</summary>
              <p>تدفع نقداً للمندوب عند الاستلام. التوصيل إلى بغداد 5,000 د.ع خلال يوم إلى يومين، وباقي المحافظات 8,000 د.ع خلال يومين إلى أربعة أيام.</p>
            </details>
            <details>
              <summary>تبديل المقاس</summary>
              <p>إذا لم يناسب المقاس، بدّله مجاناً خلال 7 أيام من الاستلام بشرط أن يكون الحذاء غير ملبوس وفي علبته.</p>
            </details>
          </div>
        </div>
      </div>

      <SizeGuide open={guide} onClose={() => setGuide(false)} sizes={color.variants.map(v => v.size)} current={variant?.size} />

      {related.length > 0 && (
        <section className="wrap block" aria-labelledby="related-title">
          <div className="block-head"><h2 id="related-title">قد يعجبك أيضاً</h2></div>
          <Rail products={related} label="قد يعجبك أيضاً" />
        </section>
      )}
    </div>
  );
}
