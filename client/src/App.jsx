import { useEffect } from 'react';
import { Link, Outlet, Route, Routes, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import TabBar from './components/TabBar.jsx';
import Favorites from './pages/Favorites.jsx';
import Sizes from './pages/Sizes.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import Product from './pages/Product.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderPlaced from './pages/OrderPlaced.jsx';
import Track from './pages/Track.jsx';
import Account from './pages/Account.jsx';
import { Login, Register } from './pages/Auth.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import { Orders, OrderDetail } from './pages/admin/Orders.jsx';
import Products from './pages/admin/Products.jsx';
import ProductEdit from './pages/admin/ProductEdit.jsx';

// Pages with their own sticky action bar hide the bottom tabs on phones.
const OWN_BAR = [/^\/p\//, /^\/checkout/];

function StoreLayout() {
  const { pathname } = useLocation();
  const ownBar = OWN_BAR.some(r => r.test(pathname));
  return (
    <div className={`app${ownBar ? ' own-bar' : ''}`}>
      <a href="#main" className="sr skip">انتقل إلى المحتوى</a>
      <Header />
      <main id="main"><Outlet /></main>
      <Footer />
      {!ownBar && <TabBar />}
    </div>
  );
}

function NotFound() {
  return (
    <div className="wrap empty" style={{ paddingBlock: 96 }}>
      <h1 className="page-title" style={{ padding: 0 }}>هذه الصفحة غير موجودة</h1>
      <p>ربما تغيّر الرابط أو حُذف المنتج.</p>
      <Link to="/shop" className="btn">تسوّق الأحذية</Link>
    </div>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route element={<StoreLayout />}>
          <Route index element={<Home />} />
          <Route path="shop" element={<Shop />} />
          <Route path="p/:slug" element={<Product />} />
          <Route path="cart" element={<Cart />} />
          <Route path="favorites" element={<Favorites />} />
          <Route path="sizes" element={<Sizes />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="order/:code" element={<OrderPlaced />} />
          <Route path="track" element={<Track />} />
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
          <Route path="account" element={<Account />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="products/:id" element={<ProductEdit />} />
        </Route>
      </Routes>
    </>
  );
}
