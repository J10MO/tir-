import { useEffect, useRef } from 'react';
import { SIZE_CHART } from '../lib/sizes.js';
import Icon from './Icon.jsx';

export function SizeTable({ available, highlight }) {
  const rows = available ? SIZE_CHART.filter(r => available.has(r.size) || highlight === r.size) : SIZE_CHART;
  return (
    <table className="size-table">
      <thead>
        <tr><th>المقاس</th><th>طول القدم</th><th>العمر تقريباً</th></tr>
      </thead>
      <tbody>
        {rows.map(r => (
          <tr key={r.size} className={highlight === r.size ? 'on' : undefined}>
            <td><b>{r.size}</b></td>
            <td><span className="latin">{r.cm}</span> سم</td>
            <td>{r.age}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function HowToMeasure() {
  return (
    <ol className="measure-steps">
      <li><b>ضع ورقة على الأرض</b>وقِف الطفل عليها وكعبه ملاصق للحائط.</li>
      <li><b>علّم طرف أطول إصبع</b>بقلم، والطفل واقف وليس جالساً.</li>
      <li><b>قِس المسافة بالمسطرة</b>من الحائط إلى العلامة، وزِد نصف سنتيمتر للراحة.</li>
      <li><b>اختر المقاس</b>الذي يساوي طوله قياسك أو أكبر منه بقليل.</li>
    </ol>
  );
}

// Bottom sheet on phones, centred dialog on wider screens.
export default function SizeGuide({ open, onClose, sizes, current }) {
  const ref = useRef(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog ref={ref} className="sheet-dialog" onClose={onClose} onClick={e => e.target === ref.current && onClose()} aria-labelledby="size-guide-title">
      <div className="sheet-inner">
        <span className="grabber" aria-hidden="true" />
        <header>
          <h2 id="size-guide-title">دليل المقاسات</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="إغلاق"><Icon name="close" /></button>
        </header>
        <p className="muted">المقاسات أوروبية. الأهم هو طول القدم، فالعمر تقريبي ويختلف من طفل لآخر.</p>
        <SizeTable available={sizes ? new Set(sizes) : null} highlight={current} />
        <h3>كيف تقيس قدم طفلك</h3>
        <HowToMeasure />
      </div>
    </dialog>
  );
}
