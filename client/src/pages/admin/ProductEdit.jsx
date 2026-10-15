import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { useApi } from '../../lib/useApi.js';

const PRESETS = [
  ['رجالي 39–45', [39, 40, 41, 42, 43, 44, 45]],
  ['نسائي 36–41', [36, 37, 38, 39, 40, 41]],
  ['أطفال 28–35', [28, 29, 30, 31, 32, 33, 34, 35]],
];

const blankColor = () => ({ key: crypto.randomUUID(), name: '', hex: '#2A2A2A', images: [], variants: [] });

function fromProduct(p) {
  return {
    name: p.name,
    slug: p.slug,
    description: p.description,
    price: String(p.price),
    compareAtPrice: p.compare_at_price ? String(p.compare_at_price) : '',
    categoryId: p.category_id ? String(p.category_id) : '',
    isActive: p.is_active,
    isFeatured: p.is_featured,
    colors: p.colors.map(c => ({
      key: String(c.id), id: c.id, name: c.name, hex: c.hex, images: c.images,
      variants: c.variants.map(v => ({ size: v.size, stock: String(v.stock) })),
    })),
  };
}

export default function ProductEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const categories = useApi('/categories');
  const existing = useApi(isNew ? null : `/admin/products/${id}`);

  const [form, setForm] = useState(() => ({
    name: '', slug: '', description: '', price: '', compareAtPrice: '', categoryId: '',
    isActive: true, isFeatured: false, colors: [blankColor()],
  }));
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(null);

  useEffect(() => { if (existing.data) setForm(fromProduct(existing.data)); }, [existing.data]);

  if (!isNew && existing.loading) return <div className="skeleton" />;
  if (!isNew && existing.error) return <p className="error">{existing.error.message}</p>;

  const set = (key, value) => { setForm(f => ({ ...f, [key]: value })); setSaved(''); };
  const setColor = (key, patch) => {
    setForm(f => ({ ...f, colors: f.colors.map(c => (c.key === key ? { ...c, ...(typeof patch === 'function' ? patch(c) : patch) } : c)) }));
    setSaved('');
  };

  function addSizes(key, sizes) {
    setColor(key, c => {
      const have = new Set(c.variants.map(v => v.size));
      const added = sizes.filter(s => !have.has(s)).map(size => ({ size, stock: '0' }));
      return { variants: [...c.variants, ...added].sort((a, b) => a.size - b.size) };
    });
  }

  async function upload(key, file) {
    if (!file) return;
    setUploading(key); setError('');
    try {
      const body = new FormData();
      body.append('image', file);
      const { url } = await api('/admin/uploads', { method: 'POST', form: body });
      setColor(key, c => ({ images: [...c.images, url] }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(null);
    }
  }

  async function save(e) {
    e.preventDefault();
    setBusy(true); setError(''); setSaved('');
    const payload = {
      ...form,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : null,
      categoryId: form.categoryId ? Number(form.categoryId) : null,
      colors: form.colors.map(c => ({
        id: c.id, name: c.name, hex: c.hex, images: c.images,
        variants: c.variants.map(v => ({ size: v.size, stock: Number(v.stock || 0) })),
      })),
    };
    try {
      const product = await api(isNew ? '/admin/products' : `/admin/products/${id}`, { method: isNew ? 'POST' : 'PUT', body: payload });
      setForm(fromProduct(product));
      setSaved('حُفظت التغييرات.');
      if (isNew) navigate(`/admin/products/${product.id}`, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!window.confirm('حذف هذا المنتج من المتجر؟')) return;
    try {
      const r = await api(`/admin/products/${id}`, { method: 'DELETE' });
      if (r.hidden) window.alert('هذا المنتج موجود في طلبات سابقة، لذلك أُخفي من المتجر بدلاً من حذفه.');
      navigate('/admin/products');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <form className="editor" onSubmit={save}>
      <div>
        <p className="muted"><Link to="/admin/products">المنتجات</Link> / {isNew ? 'منتج جديد' : form.name}</p>
        <h1 style={{ marginTop: 8 }}>{isNew ? 'إضافة منتج' : 'تعديل المنتج'}</h1>
      </div>

      <section>
        <h2 style={{ margin: 0 }}>المعلومات الأساسية</h2>
        <div className="row3">
          <label className="field">
            <span>اسم المنتج</span>
            <input required value={form.name} onChange={e => set('name', e.target.value)} />
          </label>
          <label className="field">
            <span>السعر (دينار)</span>
            <input required inputMode="numeric" className="ltr" value={form.price} onChange={e => set('price', e.target.value.replace(/\D/g, ''))} />
          </label>
          <label className="field">
            <span>السعر قبل الخصم <span className="muted">(اختياري)</span></span>
            <input inputMode="numeric" className="ltr" value={form.compareAtPrice} onChange={e => set('compareAtPrice', e.target.value.replace(/\D/g, ''))} />
          </label>
        </div>
        <div className="row3">
          <label className="field">
            <span>القسم</span>
            <select value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
              <option value="">بدون قسم</option>
              {(categories.data ?? []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>رابط المنتج <span className="muted">(اختياري)</span></span>
            <input className="ltr" placeholder="dijla" value={form.slug} onChange={e => set('slug', e.target.value)} />
            <small>يظهر في العنوان: /p/{form.slug || '…'}</small>
          </label>
          <div style={{ display: 'grid', gap: 10, alignContent: 'center' }}>
            <label className="check"><input type="checkbox" checked={form.isActive} onChange={e => set('isActive', e.target.checked)} /> معروض في المتجر</label>
            <label className="check"><input type="checkbox" checked={form.isFeatured} onChange={e => set('isFeatured', e.target.checked)} /> يظهر في اختيارات تير</label>
          </div>
        </div>
        <label className="field">
          <span>الوصف</span>
          <textarea value={form.description} onChange={e => set('description', e.target.value)} placeholder="الخامة، النعل، طريقة المقاس" />
        </label>
      </section>

      <section>
        <h2 style={{ margin: 0 }}>الألوان والمقاسات</h2>
        <p className="muted" style={{ marginTop: -10 }}>لكل لون صوره ومقاساته. اكتب عدد الأزواج المتوفرة من كل مقاس.</p>
        {form.colors.map(c => (
          <div className="color-block" key={c.key}>
            <header>
              <label className="field">
                <span>اسم اللون</span>
                <input required value={c.name} placeholder="مثلاً: فحمي" onChange={e => setColor(c.key, { name: e.target.value })} />
              </label>
              <label className="field">
                <span>درجة اللون</span>
                <input type="color" value={c.hex} onChange={e => setColor(c.key, { hex: e.target.value })} />
              </label>
              {form.colors.length > 1 && (
                <button type="button" className="btn danger" onClick={() => set('colors', form.colors.filter(x => x.key !== c.key))}>
                  حذف اللون
                </button>
              )}
            </header>

            <div>
              <p style={{ fontWeight: 500, marginBottom: 8 }}>الصور</p>
              <div className="images">
                {c.images.map((src, i) => (
                  <figure key={src}>
                    <img src={src} alt={`صورة ${i + 1} للون ${c.name}`} />
                    <button type="button" onClick={() => setColor(c.key, x => ({ images: x.images.filter(s => s !== src) }))}>حذف</button>
                  </figure>
                ))}
                <label className="upload">
                  {uploading === c.key ? 'جارٍ الرفع…' : 'رفع صورة'}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => { upload(c.key, e.target.files[0]); e.target.value = ''; }} />
                </label>
              </div>
              <small className="muted">الصورة الأولى تظهر في المتجر. JPG أو PNG أو WEBP، حتى 5 ميغابايت.</small>
            </div>

            <div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 500 }}>المقاسات</span>
                {PRESETS.map(([label, sizes]) => (
                  <button key={label} type="button" className="chip" onClick={() => addSizes(c.key, sizes)}>أضف {label}</button>
                ))}
                <AddSize onAdd={size => addSizes(c.key, [size])} />
              </div>
              {c.variants.length ? (
                <div className="size-grid">
                  {c.variants.map(v => (
                    <label key={v.size}>
                      <b>مقاس {v.size}</b>
                      الكمية
                      <input inputMode="numeric" value={v.stock}
                        onChange={e => setColor(c.key, x => ({ variants: x.variants.map(y => y.size === v.size ? { ...y, stock: e.target.value.replace(/\D/g, '') } : y) }))} />
                      <button type="button" className="x" aria-label={`حذف مقاس ${v.size}`}
                        onClick={() => setColor(c.key, x => ({ variants: x.variants.filter(y => y.size !== v.size) }))}>×</button>
                    </label>
                  ))}
                </div>
              ) : <p className="muted">لم تُضف مقاسات لهذا اللون بعد.</p>}
            </div>
          </div>
        ))}
        <button type="button" className="btn ghost" onClick={() => set('colors', [...form.colors, blankColor()])}>إضافة لون</button>
      </section>

      <div className="save-bar">
        <button className="btn" disabled={busy}>{busy ? 'جارٍ الحفظ…' : isNew ? 'إضافة المنتج' : 'حفظ التغييرات'}</button>
        {!isNew && existing.data?.is_active && <Link to={`/p/${form.slug}`} target="_blank" className="btn ghost">عرضه في المتجر</Link>}
        {!isNew && <button type="button" className="btn danger" onClick={remove}>حذف المنتج</button>}
        {saved && <span role="status">{saved}</span>}
        {error && <span className="error" role="alert">{error}</span>}
      </div>
    </form>
  );
}

function AddSize({ onAdd }) {
  const [value, setValue] = useState('');
  return (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      <input aria-label="مقاس آخر" inputMode="numeric" placeholder="مقاس" value={value} onChange={e => setValue(e.target.value.replace(/\D/g, ''))}
        style={{ width: 72, minHeight: 38, background: 'var(--raised)', border: '1px solid var(--seam)', borderRadius: 'var(--radius)', padding: '0 10px' }} />
      <button type="button" className="chip" disabled={!value} onClick={() => { onAdd(Number(value)); setValue(''); }}>أضف</button>
    </span>
  );
}
