import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SIZE_CHART } from '../lib/sizes.js';
import { useChildSize } from '../context/ChildSizeContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Icon from './Icon.jsx';

const RULER_CM = 20;
const MIN_CM = 10;
const MAX_CM = 19.5;

// Smallest size whose foot length covers the measurement.
export const sizeForCm = cm => SIZE_CHART.find(r => Number(r.cm) >= cm) ?? null;

const plural = n => (n === 1 ? 'موديل واحد متوفر' : n === 2 ? 'موديلان متوفران' : `${n} موديلات متوفرة`);

// A child's footprint, heel on the right (RTL start), toes on the left.
function Footprint() {
  return (
    <svg viewBox="0 0 250 100" aria-hidden="true">
      <path d="M246 49 C246 38 238 32 222 32 C195 32 170 31 145 29 C118 27 96 21 72 21 C52 21 38 32 37 48 C36 66 50 79 70 79 C96 79 112 72 134 63 C152 56 170 62 196 66 C214 69 230 68 240 62 C244 58 246 54 246 49 Z" />
      <circle cx="22" cy="27" r="11" /><circle cx="15" cy="48" r="7.5" /><circle cx="17" cy="63" r="6.5" />
      <circle cx="24" cy="76" r="5.5" /><circle cx="33" cy="87" r="4.5" />
    </svg>
  );
}

export default function FootMeasure({ products = [] }) {
  const child = useChildSize();
  const toast = useToast();
  const savedRow = SIZE_CHART.find(r => r.size === child.size);
  const [cm, setCm] = useState(savedRow ? Number(savedRow.cm) : 15);

  const row = sizeForCm(cm);
  const count = row ? products.filter(p => p.sizes.includes(row.size)).length : 0;
  const saved = row && child.size === row.size;

  function onSlide(e) {
    const v = Math.min(MAX_CM, Math.max(MIN_CM, Number(e.target.value)));
    setCm(Math.round(v * 10) / 10);
  }

  function save() {
    child.save(row.size);
    toast(`حفظنا مقاس طفلك: ${row.size}. سنعلّم الأحذية التي تناسبه.`, { to: `/shop?size=${row.size}`, label: 'اعرضها' });
  }

  return (
    <section className="measure" aria-labelledby="measure-title">
      <div className="measure-copy">
        <h2 id="measure-title">اعرف مقاس طفلك</h2>
        <p>قِس قدمه من الكعب إلى أطول إصبع، ثم اسحب المسطرة إلى نفس الطول.</p>
      </div>

      <div className="measure-board">
        <div className="foot" style={{ width: `${(cm / RULER_CM) * 100}%` }}><Footprint /></div>
        <div className="ruler" aria-hidden="true">
          {Array.from({ length: RULER_CM / 2 + 1 }, (_, i) => i * 2).map(n => (
            <span key={n} style={{ insetInlineStart: `${(n / RULER_CM) * 100}%` }}>{n}</span>
          ))}
        </div>
        <input
          type="range" className="measure-range" min="0" max={RULER_CM} step="0.1" value={cm} onChange={onSlide}
          aria-label="طول قدم طفلك بالسنتيمتر"
          aria-valuetext={`${cm} سم${row ? `، مقاس ${row.size}` : ''}`}
        />
      </div>

      <div className="measure-result" aria-live="polite">
        <div className="readout">
          <span className="readout-cm"><b className="latin">{cm.toFixed(1)}</b> سم</span>
          <span className="readout-size">
            <small>المقاس</small>
            <b>{row ? row.size : '—'}</b>
          </span>
        </div>
        {row ? (
          <>
            <p className="readout-note">عمر {row.age} تقريباً. {count ? plural(count) : 'لا يوجد موديل بهذا المقاس حالياً'}.</p>
            <div className="measure-actions">
              {count > 0 && <Link to={`/shop?size=${row.size}`} className="btn ink">اعرض الأحذية بمقاس {row.size}</Link>}
              {saved ? (
                <button type="button" className="btn ink-ghost" onClick={child.clear}><Icon name="check" size={18} /> مقاس طفلك محفوظ</button>
              ) : (
                <button type="button" className="btn ink-ghost" onClick={save}>احفظ مقاس طفلي</button>
              )}
            </div>
          </>
        ) : (
          <p className="readout-note">هذا أكبر من مقاساتنا الحالية (حتى 30).</p>
        )}
      </div>
    </section>
  );
}
