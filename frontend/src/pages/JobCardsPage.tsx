import { useEffect, useState } from 'react';
import {
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  createTableColumn,
  type TableColumnDefinition
} from '@fluentui/react-components';
import { Play24Regular, Checkmark24Regular, Dismiss24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { useListView } from '../hooks/useListView';
import {
  cancelJobCard,
  completeJobCard,
  getJobCards,
  startJobCard
} from '../services/jobCardService';
import { apiErrorMessage } from '../api/client';
import type { JobCard } from '../api/types';

const money = (v?: number | null) => (v == null ? '—' : `$${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

const JOB_STATUSES = ['Open', 'InProgress', 'Completed', 'Cancelled'];
const JOB_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function JobCardsPage() {
  const [jobs, setJobs] = useState<JobCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<JobCard | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setJobs(await getJobCards());
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to load job cards.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const runAction = async (action: () => Promise<unknown>, id: number) => {
    setBusyId(id);
    setError(null);
    try {
      await action();
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Action failed.'));
    } finally {
      setBusyId(null);
    }
  };

  const view = useListView<JobCard>({
    items: jobs,
    searchFields: (j) => [j.jobNumber, j.title, j.description],
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: JOB_STATUSES.map((s) => ({ value: s, label: s })),
        predicate: (j, value) =>
          (j.status ?? '').toLowerCase().replace(/\s/g, '') === value.toLowerCase()
      },
      {
        key: 'priority',
        label: 'Priority',
        options: JOB_PRIORITIES.map((s) => ({ value: s, label: s })),
        predicate: (j, value) => (j.priority ?? '').toLowerCase() === value.toLowerCase()
      }
    ]
  });

  const columns: TableColumnDefinition<JobCard>[] = [
    createTableColumn<JobCard>({
      columnId: 'number',
      renderHeaderCell: () => 'Job #',
      renderCell: (j) => j.jobNumber
    }),    createTableColumn<JobCard>({
      columnId: 'title',
      renderHeaderCell: () => 'Title',
      renderCell: (j) => j.title
    }),
    createTableColumn<JobCard>({
      columnId: 'priority',
      renderHeaderCell: () => 'Priority',
      renderCell: (j) => <StatusBadge value={j.priority} />
    }),
    createTableColumn<JobCard>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (j) => <StatusBadge value={j.status} />
    }),
    createTableColumn<JobCard>({
      columnId: 'cost',
      renderHeaderCell: () => 'Cost (est / actual)',
      renderCell: (j) => `${money(j.estimatedCost)} / ${money(j.actualCost)}`
    }),
    createTableColumn<JobCard>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (j) => {
        const status = (j.status ?? '').toLowerCase().replace(/\s/g, '');
        const busy = busyId === j.id;
        return (
          <div style={{ display: 'flex', gap: 6 }}>
            {status === 'open' && (
              <Button
                size="small"
                icon={<Play24Regular />}
                disabled={busy}
                onClick={() => runAction(() => startJobCard(j.id, j.assignedToUserId ?? null), j.id)}
              >
                Start
              </Button>
            )}
            {status === 'inprogress' && (
              <Button
                size="small"
                appearance="primary"
                icon={<Checkmark24Regular />}
                disabled={busy}
                onClick={() => setCompleteTarget(j)}
              >
                Complete
              </Button>
            )}
            {(status === 'open' || status === 'inprogress') && (
              <Button
                size="small"
                icon={<Dismiss24Regular />}
                disabled={busy}
                onClick={() => runAction(() => cancelJobCard(j.id), j.id)}
              >
                Cancel
              </Button>
            )}
          </div>
        );
      }
    })
  ];

  return (
    <>
      <PageHeader title="Job cards" subtitle="Workshop work orders and their repair lifecycle." />
      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {loading ? (
        <Spinner label="Loading job cards…" />
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder="Search job #, title…" />
          <DataGrid items={view.pageItems} columns={columns} getRowId={(j) => j.id}>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<JobCard>>
              {({ item, rowId }) => (
                <DataGridRow<JobCard> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
          <Pagination view={view} noun="job cards" />
        </>
      )}

      <CompleteDialog
        job={completeTarget}
        onClose={() => setCompleteTarget(null)}
        onDone={async (actualCost) => {
          if (completeTarget) {
            await runAction(() => completeJobCard(completeTarget.id, actualCost), completeTarget.id);
          }
          setCompleteTarget(null);
        }}
      />
    </>
  );
}

function CompleteDialog({
  job,
  onClose,
  onDone
}: {
  job: JobCard | null;
  onClose: () => void;
  onDone: (actualCost: number | null) => Promise<void>;
}) {
  const [actualCost, setActualCost] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await onDone(actualCost ? Number(actualCost) : null);
      setActualCost('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!job} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Complete job card {job?.jobNumber}</DialogTitle>
          <DialogContent>
            <Field label="Actual cost">
              <Input
                type="number"
                value={actualCost}
                onChange={(_, d) => setActualCost(d.value)}
                contentBefore="$"
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={submit} disabled={saving}>
              {saving ? <Spinner size="tiny" /> : 'Complete'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
