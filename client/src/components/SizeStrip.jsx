import { footCm } from '../lib/format.js';

// Sizes laid out like a shoe-shop foot measurer: EU size above, foot length (cm) below.
export default function SizeStrip({ variants, value, onChange, name = 'size' }) {
  return (
    <div className="strip" style={{ '--n': variants.length }} role="radiogroup" aria-label="المقاس">
      {variants.map(v => {
        const out = v.stock === 0;
        const note = out ? '، نفد' : v.stock <= 2 ? `، بقي ${v.stock}` : '';
        return (
          <label className="size" key={v.id}>
            <input
              type="radio"
              name={name}
              value={v.id}
              disabled={out}
              checked={value === v.id}
              onChange={() => onChange(v.id)}
              aria-label={`مقاس ${v.size}، يناسب قدماً بطول ${footCm(v.size)} سم${note}`}
            />
            <span aria-hidden="true">
              <b>{v.size}</b>
              <small>{footCm(v.size)}</small>
            </span>
          </label>
        );
      })}
    </div>
  );
}
