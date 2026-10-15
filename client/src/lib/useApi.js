import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

// Fetches `path` and re-fetches when it changes. Pass null to skip.
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });

  const load = useCallback(() => {
    if (!path) return;
    let live = true;
    setState(s => ({ ...s, loading: true, error: null }));
    api(path)
      .then(data => live && setState({ data, error: null, loading: false }))
      .catch(error => live && setState({ data: null, error, loading: false }));
    return () => { live = false; };
  }, [path]);

  useEffect(load, [load]);

  return { ...state, reload: load, setData: data => setState(s => ({ ...s, data })) };
}
