import { STATUS } from '../lib/format.js';

export const StatusBadge = ({ status }) => <span className={`status ${status}`}>{STATUS[status]}</span>;

const STEPS = ['new', 'confirmed', 'shipped', 'delivered'];

export function Timeline({ status }) {
  if (status === 'cancelled') return <p className="notice error">أُلغي هذا الطلب.</p>;
  const reached = STEPS.indexOf(status);
  return (
    <ol className="timeline" aria-label="مراحل الطلب">
      {STEPS.map((s, i) => (
        <li key={s} className={i <= reached ? 'done' : undefined} aria-current={i === reached ? 'step' : undefined}>
          {s === 'new' ? 'استلمنا طلبك' : STATUS[s]}
        </li>
      ))}
    </ol>
  );
}
