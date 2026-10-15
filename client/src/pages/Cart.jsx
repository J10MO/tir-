import { Link } from 'react-router-dom';
import { useCart, MAX_QTY } from '../context/CartContext.jsx';
import { money, pairs } from '../lib/format.js';
import Icon from '../components/Icon.jsx';

export default function Cart() {
  const cart = useCart();

  if (!cart.items.length) {
    return (
      <div className="wrap page">
        <h1 className="page-title">السلة</h1>
        <div className="empty-state">
          <Icon name="bag" size={40} />
          <h2>سلتك فارغة</h2>
          <p>اختر حذاءً ومقاساً ليظهر هنا.</p>
          <Link to="/shop" className="btn">تسوّق الأحذية</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wrap page">
      <h1 className="page-title">السلة <span className="muted">({pairs(cart.count)})</span></h1>
      <div className="cart-layout">
        <ul className="lines">
          {cart.items.map(item => (
            <li className="line" key={item.variantId}>
              <Link to={`/p/${item.slug}`} className="line-img" tabIndex={-1} aria-hidden="true">
                {item.image && <img src={item.image} alt="" width="1200" height="900" />}
              </Link>
              <div className="line-body">
                <div className="line-top">
                  <h3><Link to={`/p/${item.slug}`}>{item.name}</Link></h3>
                  <button type="button" className="icon-btn small" aria-label={`إزالة ${item.name} من السلة`} onClick={() => cart.remove(item.variantId)}>
                    <Icon name="trash" size={18} />
                  </button>
                </div>
                <p className="muted">{item.colorName}، مقاس {item.size}</p>
                <div className="line-bottom">
                  <b>{money(item.price * item.qty)}</b>
                  <div className="qty" role="group" aria-label={`كمية ${item.name}`}>
                    <button type="button" aria-label="إنقاص" disabled={item.qty <= 1} onClick={() => cart.setQty(item.variantId, item.qty - 1)}>
                      <Icon name="minus" size={16} />
                    </button>
                    <output aria-live="polite">{item.qty}</output>
                    <button type="button" aria-label="زيادة" disabled={item.qty >= Math.min(MAX_QTY, item.stock ?? MAX_QTY)}
                      onClick={() => cart.setQty(item.variantId, item.qty + 1)}>
                      <Icon name="plus" size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="summary" aria-label="ملخص السلة">
          <h2>الملخص</h2>
          <div className="row"><span>{pairs(cart.count)}</span><span>{money(cart.subtotal)}</span></div>
          <div className="row muted"><span>التوصيل</span><span>حسب المحافظة</span></div>
          <div className="row total"><span>المجموع</span><span>{money(cart.subtotal)}</span></div>
          <p className="muted small">تدفع نقداً عند الاستلام. لا تحتاج بطاقة.</p>
          <div className="checkout-bar">
            <div className="buy-bar-price">
              <span className="muted">المجموع</span>
              <b>{money(cart.subtotal)}</b>
            </div>
            <Link to="/checkout" className="btn big">إتمام الطلب</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
