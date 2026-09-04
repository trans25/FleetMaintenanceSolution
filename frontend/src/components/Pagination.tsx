import { Button, Text, makeStyles, tokens } from '@fluentui/react-components';
import {
  ChevronLeft24Regular,
  ChevronRight24Regular,
  ChevronDoubleLeftRegular,
  ChevronDoubleRightRegular
} from '@fluentui/react-icons';
import type { UseListViewResult } from '../hooks/useListView';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
    marginTop: '16px'
  },
  info: { color: tokens.colorNeutralForeground3 },
  controls: { display: 'flex', alignItems: 'center', gap: '6px' }
});

/** Reusable pagination footer driven by useListView. */
export function Pagination<T>({ view, noun = 'items' }: { view: UseListViewResult<T>; noun?: string }) {
  const styles = useStyles();
  const { page, totalPages, rangeStart, rangeEnd, filteredCount, totalCount } = view;

  const summary =
    filteredCount === 0
      ? `No ${noun}`
      : `Showing ${rangeStart}–${rangeEnd} of ${filteredCount}${
          filteredCount !== totalCount ? ` (filtered from ${totalCount})` : ''
        } ${noun}`;

  return (
    <div className={styles.root}>
      <Text className={styles.info}>{summary}</Text>
      <div className={styles.controls}>
        <Button
          appearance="subtle"
          icon={<ChevronDoubleLeftRegular />}
          aria-label="First page"
          disabled={page <= 1}
          onClick={() => view.setPage(1)}
        />
        <Button
          appearance="subtle"
          icon={<ChevronLeft24Regular />}
          aria-label="Previous page"
          disabled={page <= 1}
          onClick={() => view.setPage(page - 1)}
        />
        <Text className={styles.info}>
          Page {page} of {totalPages}
        </Text>
        <Button
          appearance="subtle"
          icon={<ChevronRight24Regular />}
          aria-label="Next page"
          disabled={page >= totalPages}
          onClick={() => view.setPage(page + 1)}
        />
        <Button
          appearance="subtle"
          icon={<ChevronDoubleRightRegular />}
          aria-label="Last page"
          disabled={page >= totalPages}
          onClick={() => view.setPage(totalPages)}
        />
      </div>
    </div>
  );
}
