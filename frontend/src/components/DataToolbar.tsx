import {
  Button,
  Dropdown,
  Option,
  SearchBox,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import type { UseListViewResult } from '../hooks/useListView';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '16px'
  },
  search: { minWidth: '260px', flex: '1 1 260px' },
  field: { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' },
  label: { fontSize: tokens.fontSizeBase200, color: tokens.colorNeutralForeground3 },
  spacer: { flex: '1 1 auto' }
});

export interface DataToolbarProps<T> {
  view: UseListViewResult<T>;
  searchPlaceholder?: string;
}

/** Reusable search + filter + page-size toolbar driven by useListView. */
export function DataToolbar<T>({ view, searchPlaceholder = 'Search…' }: DataToolbarProps<T>) {
  const styles = useStyles();

  return (
    <div className={styles.root}>
      <div className={styles.search}>
        <SearchBox
          placeholder={searchPlaceholder}
          value={view.search}
          onChange={(_, d) => view.setSearch(d.value)}
          style={{ width: '100%' }}
        />
      </div>

      {view.filters.map((def) => {
        const value = view.filterValues[def.key] ?? '';
        const selected = value
          ? def.options.find((o) => o.value === value)?.label ?? 'All'
          : 'All';
        return (
          <div key={def.key} className={styles.field}>
            <span className={styles.label}>{def.label}</span>
            <Dropdown
              value={selected}
              selectedOptions={[value]}
              onOptionSelect={(_, d) => view.setFilter(def.key, d.optionValue ?? '')}
            >
              <Option value="">All</Option>
              {def.options.map((o) => (
                <Option key={o.value} value={o.value}>
                  {o.label}
                </Option>
              ))}
            </Dropdown>
          </div>
        );
      })}

      <div className={styles.field}>
        <span className={styles.label}>Rows per page</span>
        <Dropdown
          value={String(view.pageSize)}
          selectedOptions={[String(view.pageSize)]}
          onOptionSelect={(_, d) => view.setPageSize(Number(d.optionValue ?? '10'))}
          style={{ minWidth: '80px' }}
        >
          {[10, 25, 50, 100].map((n) => (
            <Option key={n} value={String(n)}>
              {String(n)}
            </Option>
          ))}
        </Dropdown>
      </div>

      {view.hasActiveQuery && (
        <Button appearance="subtle" icon={<Dismiss24Regular />} onClick={view.reset}>
          Clear
        </Button>
      )}
    </div>
  );
}
