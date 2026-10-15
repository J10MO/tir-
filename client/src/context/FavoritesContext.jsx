import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'tir.favorites';
const FavoritesContext = createContext(null);

function load() {
  try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; }
}

// Favourites are kept on this device as a list of product slugs.
export function FavoritesProvider({ children }) {
  const [slugs, setSlugs] = useState(load);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(slugs)); } catch { /* ignore */ }
  }, [slugs]);

  const value = useMemo(() => ({
    slugs,
    has: slug => slugs.includes(slug),
    toggle: slug => setSlugs(list => (list.includes(slug) ? list.filter(s => s !== slug) : [slug, ...list])),
  }), [slugs]);

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export const useFavorites = () => useContext(FavoritesContext);
