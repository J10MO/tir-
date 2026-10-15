import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const CART_KEY = 'tir.cart';
export const MAX_QTY = 5;

const CartContext = createContext(null);

function load() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch { /* ignore */ }
  }, [items]);

  const value = useMemo(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotal: items.reduce((n, i) => n + i.qty * i.price, 0),
    add(line) {
      setItems(list => {
        const found = list.find(i => i.variantId === line.variantId);
        if (found) {
          return list.map(i => i.variantId === line.variantId
            ? { ...i, qty: Math.min(i.qty + line.qty, MAX_QTY, line.stock ?? MAX_QTY) } : i);
        }
        return [...list, line];
      });
    },
    setQty(variantId, qty) {
      setItems(list => list.map(i => i.variantId === variantId ? { ...i, qty: Math.max(1, Math.min(qty, MAX_QTY)) } : i));
    },
    remove(variantId) {
      setItems(list => list.filter(i => i.variantId !== variantId));
    },
    clear() { setItems([]); },
  }), [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
