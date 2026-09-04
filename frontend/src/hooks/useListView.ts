import { useEffect, useMemo, useState } from 'react';

export interface FilterOption {
  /** Value stored in state. Empty string means "no filter" (All). */
  value: string;
  /** Label shown in the dropdown. */
  label: string;
}

export interface FilterDef<T> {
  /** Stable key for the filter (used as dropdown id). */
  key: string;
  /** Label shown above the dropdown. */
  label: string;
  /** Selectable options (excluding the automatically-added "All"). */
  options: FilterOption[];
  /** Returns true when the item matches the selected value. */
  predicate: (item: T, value: string) => boolean;
}

export interface UseListViewOptions<T> {
  items: T[];
  /** Fields/derived strings searched by the free-text search box. */
  searchFields: (item: T) => Array<string | number | null | undefined>;
  filters?: FilterDef<T>[];
  initialPageSize?: number;
}

export interface UseListViewResult<T> {
  // search
  search: string;
  setSearch: (value: string) => void;
  // filters
  filters: FilterDef<T>[];
  filterValues: Record<string, string>;
  setFilter: (key: string, value: string) => void;
  // pagination
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  // results
  pageItems: T[];
  filteredCount: number;
  totalCount: number;
  rangeStart: number;
  rangeEnd: number;
  hasActiveQuery: boolean;
  reset: () => void;
}

/**
 * Client-side search + filter + pagination over an in-memory array.
 * Keeps existing data-loading untouched; pages simply feed their loaded rows in.
 */
export function useListView<T>({
  items,
  searchFields,
  filters = [],
  initialPageSize = 10
}: UseListViewOptions<T>): UseListViewResult<T> {
  const [search, setSearch] = useState('');
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const setFilter = (key: string, value: string) =>
    setFilterValues((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setSearch('');
    setFilterValues({});
    setPage(1);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((item) => {
      if (term) {
        const haystack = searchFields(item)
          .filter((v) => v != null)
          .map((v) => String(v).toLowerCase());
        if (!haystack.some((v) => v.includes(term))) return false;
      }
      for (const def of filters) {
        const value = filterValues[def.key];
        if (value) {
          if (!def.predicate(item, value)) return false;
        }
      }
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, filterValues, filters]);

  const filteredCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(filteredCount / pageSize));

  // Keep the current page in range whenever results or page size change.
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  // Reset to first page when the query changes.
  useEffect(() => {
    setPage(1);
  }, [search, filterValues, pageSize]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const rangeStart = filteredCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, filteredCount);
  const hasActiveQuery =
    search.trim().length > 0 || Object.values(filterValues).some((v) => v);

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
    pageItems,
    filteredCount,
    totalCount: items.length,
    rangeStart,
    rangeEnd,
    hasActiveQuery,
    reset
  };
}
