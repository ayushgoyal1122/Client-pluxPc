import { useState, useEffect } from "react";

// ─── Generic async data fetching hook ─────────────────────────────────────────

interface UseFetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(
  fetcher: () => Promise<{ success: boolean; data: T; message?: string }>,
  deps: unknown[] = []
): UseFetchState<T> {
  const [state, setState] = useState<UseFetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;
    setState({ data: null, loading: true, error: null });

    fetcher()
      .then((res) => {
        if (!cancelled) {
          if (res.success) {
            setState({ data: res.data, loading: false, error: null });
          } else {
            setState({ data: null, loading: false, error: res.message ?? "Something went wrong" });
          }
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setState({ data: null, loading: false, error: err.message });
        }
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return state;
}

