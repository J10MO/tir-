import { Link } from 'react-router-dom';
import { useApi } from '../lib/useApi.js';
import { SIZE_CHART } from '../lib/sizes.js';
import { SizeTable, HowToMeasure } from '../components/SizeGuide.jsx';
import Icon from '../components/Icon.jsx';

export default function Sizes() {
  const all = useApi('/products');
  const count = size => (all.data ?? []).filter(p => p.sizes.includes(size)).length;

  return (
    <div className="wrap page narrow">
      <h1 className="page-title">دليل المقاسات</h1>
      <p className="muted lead">مقاساتنا أوروبية من 18 إلى 30. قِس قدم طفلك واختر المقاس الذي يساوي طوله أو أكبر منه بقليل، ثم اضغط على المقاس لترى الأحذية المتوفرة فيه.</p>

      <section className="sheet" aria-labelledby="measure-title" style={{ marginTop: 20 }}>
        <h2 id="measure-title"><Icon name="ruler" size={20} /> كيف تقيس قدم طفلك</h2>
        <HowToMeasure />
      </section>

      <section aria-labelledby="chart-title">
        <h2 id="chart-title" className="section-title">جدول المقاسات</h2>
        <SizeTable />
      </section>

      <section aria-labelledby="avail-title">
        <h2 id="avail-title" className="section-title">تسوّق حسب المقاس</h2>
        <div className="size-grid">
          {SIZE_CHART.map(r => {
            const n = count(r.size);
            return n ? (
              <Link key={r.size} to={`/shop?size=${r.size}`} className="size-cell">
                <b>{r.size}</b><span>{n} {n === 1 ? 'موديل' : n === 2 ? 'موديلان' : 'موديلات'}</span>
              </Link>
            ) : (
              <span key={r.size} className="size-cell off" aria-label={`مقاس ${r.size} غير متوفر حالياً`}>
                <b>{r.size}</b><span>غير متوفر</span>
              </span>
            );
          })}
        </div>
      </section>
    </div>
  );
}
