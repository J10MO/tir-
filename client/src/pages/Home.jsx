import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { money } from '../lib/format.js';
import ProductCard, { Rail } from '../components/ProductCard.jsx';
import HeroCarousel from '../components/HeroCarousel.jsx';
import FootMeasure from '../components/FootMeasure.jsx';
import Icon from '../components/Icon.jsx';
import { INSTAGRAM } from '../components/Footer.jsx';

const find = (list, slug) => list.find(p => p.slug === slug);
const plural = n => (n === 1 ? 'موديل واحد' : n === 2 ? 'موديلان' : `${n} موديلات`);

export default function Home() {
  const all = useApi('/products');
  const categories = useApi('/categories');

  const products = all.data ?? [];
  const cats = (categories.data ?? []).filter(c => c.product_count > 0);
  const featured = products.filter(p => p.is_featured);
  const newest = [...products].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8);

  const ishtar = find(products, 'ishtar');
  const nineveh = find(products, 'nineveh');
  const firstStep = products.find(p => p.category_slug === 'first-steps');

  const slides = [
    ishtar && {
      id: 'hero', tone: 'lime', kicker: 'Ancient threads, modern weaves', title: 'خيوط قديمة، نسيج حديث',
      text: 'أحذية أطفال بنعل مريح وخامات تتحمّل اللعب، من 18 إلى 30، والدفع عند الاستلام.',
      cta: 'تسوّق الآن', to: '/shop', image: ishtar.colors[0]?.image,
    },
    nineveh && {
      id: 'craft', tone: 'paper', kicker: 'Step into modern craft', title: 'خطوة نحو الحِرفة الحديثة',
      text: `أسود بالكامل، بنعل متموّج وأربطة حبل سميكة. ${money(nineveh.price)}.`,
      cta: 'شاهد الحذاء', to: `/p/${nineveh.slug}`, image: nineveh.colors[0]?.image,
    },
    firstStep && {
      id: 'first', tone: 'dark', kicker: 'First steps', title: 'لأول خطوة',
      text: 'أحذية طرية بنعل مرن لعمر 6 أشهر إلى سنتين، مقاسات 18 إلى 23.',
      cta: 'تسوّق أول خطوة', to: '/shop?category=first-steps', image: firstStep.colors[0]?.image,
    },
  ].filter(Boolean);

  return (
    <div className="home">
      <div className="wrap">
        <Link to="/shop?search=1" className="search-pill">
          <Icon name="search" size={20} />
          <span>ابحث عن حذاء، لون، أو مقاس</span>
        </Link>

        {all.loading ? <div className="skeleton hero-skel" /> : slides.length > 0 && <HeroCarousel slides={slides} />}

        {cats.length > 0 && (
          <nav className="stories" aria-label="الأقسام">
            {cats.map(c => {
              const sample = products.find(p => p.category_slug === c.slug);
              return (
                <Link key={c.id} to={`/shop?category=${c.slug}`} className="story">
                  <span className="story-ring">{sample?.colors[0]?.image && <img src={sample.colors[0].image} alt="" width="1200" height="900" />}</span>
                  <span className="story-name">{c.name}</span>
                </Link>
              );
            })}
          </nav>
        )}

        <ul className="perks" aria-label="مزايا الطلب">
          <li><Icon name="cash" /><span><b>الدفع عند الاستلام</b>بلا بطاقة</span></li>
          <li><Icon name="truck" /><span><b>توصيل لكل العراق</b>خلال 1 إلى 4 أيام</span></li>
          <li><Icon name="swap" /><span><b>تبديل المقاس</b>مجاناً خلال 7 أيام</span></li>
        </ul>

        <section className="block" aria-labelledby="featured-title">
          <div className="block-head">
            <h2 id="featured-title">اختيارات تير</h2>
            <Link to="/shop">عرض الكل</Link>
          </div>
          {all.loading ? <div className="rail">{[0, 1, 2].map(i => <div key={i} className="skeleton tile-skel" />)}</div>
            : all.error ? <p className="notice error">{all.error.message}</p>
            : <Rail products={featured} label="اختيارات تير" />}
        </section>

        <FootMeasure products={products} />

        <section className="block" aria-labelledby="new-title">
          <div className="block-head">
            <h2 id="new-title">وصل حديثاً</h2>
            <Link to="/shop?sort=new">عرض الكل</Link>
          </div>
          {!all.loading && <Rail products={newest} label="وصل حديثاً" />}
        </section>

        <section className="block" aria-labelledby="all-title">
          <div className="block-head">
            <h2 id="all-title">كل الموديلات</h2>
            <span className="muted">{plural(products.length)}</span>
          </div>
          <div className="grid">{products.map(p => <ProductCard key={p.id} product={p} />)}</div>
        </section>

        <a href={INSTAGRAM} target="_blank" rel="noreferrer" className="insta-card">
          <img src="/brand/mark.png" alt="" width="146" height="180" loading="lazy" />
          <span>
            <b>تابعنا على إنستغرام</b>
            الموديلات الجديدة تنزل هناك أولاً. <span className="latin">@tir.fashion.iq</span>
          </span>
          <Icon name="forward" />
        </a>
      </div>
    </div>
  );
}

export function ProductGrid({ state }) {
  if (state.loading) return <div className="grid">{[0, 1, 2, 3].map(i => <div key={i} className="skeleton tile-skel" />)}</div>;
  if (state.error) return <p className="notice error">{state.error.message}</p>;
  if (!state.data?.length) return <p className="empty">لا توجد أحذية هنا بعد.</p>;
  return <div className="grid">{state.data.map(p => <ProductCard key={p.id} product={p} />)}</div>;
}
