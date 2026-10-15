import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const KEY = 'tir.childSize';
const ChildSizeContext = createContext(null);

function load() {
  try { return Number(localStorage.getItem(KEY)) || null; } catch { return null; }
}

// The child's shoe size, measured once and remembered on this device.
export function ChildSizeProvider({ children }) {
  const [size, setSize] = useState(load);

  useEffect(() => {
    try { size ? localStorage.setItem(KEY, String(size)) : localStorage.removeItem(KEY); } catch { /* ignore */ }
  }, [size]);

  const value = useMemo(() => ({ size, save: setSize, clear: () => setSize(null) }), [size]);
  return <ChildSizeContext.Provider value={value}>{children}</ChildSizeContext.Provider>;
}

export const useChildSize = () => useContext(ChildSizeContext);
