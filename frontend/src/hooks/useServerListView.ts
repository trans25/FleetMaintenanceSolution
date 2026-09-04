import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FilterDef, UseListViewResult } from './useListView';

export interface ServerPage<T> {
  items: T[];
  totalCount: number;
  totalPages: number;
}

export interface ServerListQuery {
  page: number;
  pageSize: number;
  search: string;
  filterValues: Record<string, string>;
}

export interface UseServerListViewOptions<T> {
  /** Fetches a page of results from the server for the given query. */
  fetchPage: (query: ServerListQuery) => Promise<ServerPage<T>>;
  /** Filter definitions (only key/label/options are used; predicates are ignored server-side). */
  filters?: FilterDef<T>[];
  initialPageSize?: number;
  /** Debounce (ms) applied to search input before hitting the server. */
  searchDebounceMs?: number;
}

export interface UseServerListViewResult<T> extends UseListViewResult<T> {
  loading: boolean;
  error: string | null;
  /** Re-fetch the current page (e.g. after create/delete). */
  refresh: () => void;
}

/**
 * Server-side search + filter + pagination that exposes the same surface as
 * useListView, so DataToolbar and Pagination work unchanged. Filtering and
 * paging happen on the backend, making it safe for very large datasets.
 */
export function useServerListView<T>({
  fetchPage,
  filters = [],
  initialPageSize = 20,
  searchDebounceMs = 350
}: UseServerListViewOptions<T>): UseServerListViewResult<T> {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const [items, setItems] = useState<T[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  // Debounce the free-text search so we don't hit the server on every keystroke.
  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search.trim()), searchDebounceMs);
    return () => clearTimeout(id);
  }, [search, searchDebounceMs]);

  const setFilter = useCallback((key: string, value: string) => {
    setFilterValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const reset = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setFilterValues({});
    setPage(1);
  }, []);

  const refresh = useCallback(() => setReloadToken((t) => t + 1), []);

  // Reset to first page when the query changes.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterValues, pageSize]);

  const fetchRef = useRef(fetchPage);
  fetchRef.current = fetchPage;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchRef
      .current({ page, pageSize, search: debouncedSearch, filterValues })
      .then((result) => {
        if (cancelled) return;
        setItems(result.items);
        setTotalCount(result.totalCount);
        setTotalPages(Math.max(1, result.totalPages));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setItems([]);
        setTotalCount(0);
        setTotalPages(1);
        setError(err instanceof Error ? err.message : 'Unable to load data.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, debouncedSearch, filterValues, reloadToken]);

  const rangeStart = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);
  const hasActiveQuery = useMemo(
    () => debouncedSearch.length > 0 || Object.values(filterValues).some((v) => v),
    [debouncedSearch, filterValues]
  );

  return {
    search,
    setSearch,
    filters,
    filterValues,
    setFilter,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    pageItems: items,
    // Server-side: filteredCount reflects the total matching rows on the server.
    filteredCount: totalCount,
    totalCount,
    rangeStart,
    rangeEnd,
    hasActiveQuery,
    reset,
    loading,
    error,
    refresh
  };
}
