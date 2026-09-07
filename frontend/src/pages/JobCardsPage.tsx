import { useEffect, useState } from 'react';
import {
  Button,
  Checkbox,
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
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Textarea,
  createTableColumn,
  type TableColumnDefinition
} from '@fluentui/react-components';
import { Play24Regular, Checkmark24Regular, Dismiss24Regular, TaskListSquareLtr24Regular, Delete24Regular, Add24Regular, Edit24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { useServerListView } from '../hooks/useServerListView';
import {
  cancelJobCard,
  completeJobCard,
  createJobCard,
  queryJobCards,
  startJobCard,
  updateJobCard
} from '../services/jobCardService';
import {
  createJobCardTask,
  deleteJobCardTask,
  getTasksByJobCard,
  updateJobCardTask
} from '../services/jobCardTaskService';
import { getVehicles } from '../services/vehicleService';
import { getUsersByTenant } from '../services/adminService';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import type { AdminUser, JobCard, JobCardTask, Vehicle } from '../api/types';

const money = (v?: number | null) => (v == null ? '—' : `R ${v.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);

const JOB_STATUSES = ['Open', 'InProgress', 'Completed', 'Cancelled'];
const JOB_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];

export default function JobCardsPage() {
  const [actionError, setActionError] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<JobCard | null>(null);
  const [tasksTarget, setTasksTarget] = useState<JobCard | null>(null);
  const [editTarget, setEditTarget] = useState<JobCard | 'new' | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  // Server-side search + filter + pagination so the list scales.
  const view = useServerListView<JobCard>({
    initialPageSize: 20,
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: JOB_STATUSES.map((s) => ({ value: s, label: s })),
        predicate: () => true // filtering happens on the server
      },
      {
        key: 'priority',
        label: 'Priority',
        options: JOB_PRIORITIES.map((s) => ({ value: s, label: s })),
        predicate: () => true // filtering happens on the server
      }
    ],
    fetchPage: async ({ page, pageSize, search, filterValues }) => {
      const result = await queryJobCards({
        page,
        pageSize,
        search,
        status: filterValues.status,
        priority: filterValues.priority
      });
      return {
        items: result.items,
        totalCount: result.totalCount,
        totalPages: result.totalPages
      };
    }
  });

  const load = () => view.refresh();
  const loading = view.loading;
  const error = actionError ?? view.error;

  const runAction = async (action: () => Promise<unknown>, id: number) => {
    setBusyId(id);
    setActionError(null);
    try {
      await action();
      load();
    } catch (err) {
      setActionError(apiErrorMessage(err, 'Action failed.'));
    } finally {
      setBusyId(null);
    }
  };

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
            <Button
              size="small"
              icon={<TaskListSquareLtr24Regular />}
              onClick={() => setTasksTarget(j)}
            >
              Tasks
            </Button>
            <Button
              size="small"
              icon={<Edit24Regular />}
              onClick={() => setEditTarget(j)}
            >
              Edit
            </Button>
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
      <PageHeader
        title="Job cards"
        subtitle="Workshop work orders and their repair lifecycle."
        actions={
          <Button appearance="primary" icon={<Add24Regular />} onClick={() => setEditTarget('new')}>
            New job card
          </Button>
        }
      />
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

      <TasksDialog job={tasksTarget} onClose={() => setTasksTarget(null)} />

      <JobCardDialog
        target={editTarget}
        onClose={() => setEditTarget(null)}
        onSaved={() => {
          setEditTarget(null);
          load();
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
                contentBefore="R"
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

function JobCardDialog({
  target,
  onClose,
  onSaved
}: {
  target: JobCard | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = target && target !== 'new';
  const { tenantId } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [assignedToUserId, setAssignedToUserId] = useState<number | null>(null);
  const [jobNumber, setJobNumber] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Open');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setError(null);
    getVehicles().then(setVehicles).catch(() => setVehicles([]));
    // Assignee list requires admin access; degrade gracefully when unavailable.
    if (tenantId != null) {
      getUsersByTenant(tenantId).then(setUsers).catch(() => setUsers([]));
    } else {
      setUsers([]);
    }
    if (target === 'new') {
      setVehicleId(null);
      setAssignedToUserId(null);
      setJobNumber(''); // leave blank so the backend generates JOB-yyyyMMdd-XXXXXXXX
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setStatus('Open');
      setEstimatedCost('');
    } else {
      setVehicleId(target.vehicleId);
      setAssignedToUserId(target.assignedToUserId ?? null);
      setJobNumber(target.jobNumber);
      setTitle(target.title);
      setDescription(target.description ?? '');
      setPriority(target.priority);
      setStatus(target.status);
      setEstimatedCost(target.estimatedCost != null ? String(target.estimatedCost) : '');
    }
  }, [target, tenantId]);

  const submit = async () => {
    if (!vehicleId || !title.trim()) {
      setError('Vehicle and title are required.');
      return;
    }
    if (isEdit && !jobNumber.trim()) {
      setError('Job number is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: Partial<JobCard> = {
        vehicleId,
        title: title.trim(),
        description: description.trim(),
        priority,
        status,
        assignedToUserId,
        estimatedCost: estimatedCost ? Number(estimatedCost) : 0
      };
      if (isEdit) {
        await updateJobCard((target as JobCard).id, {
          ...payload,
          jobNumber: jobNumber.trim(),
          faultId: (target as JobCard).faultId ?? null,
          actualCost: (target as JobCard).actualCost ?? null
        });
      } else {
        // Omit jobNumber on create so the server auto-generates it.
        await createJobCard(payload);
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to save job card.'));
    } finally {
      setSaving(false);
    }
  };

  const vehicleLabel = (v: Vehicle) => `${v.registrationNumber} — ${v.model}`;
  const selectedVehicle = vehicles.find((v) => v.id === vehicleId);
  const assignedUser = users.find((u) => u.id === assignedToUserId);
  const assignedUserLabel = assignedUser ? assignedUser.fullName || assignedUser.username : 'Unassigned';

  return (
    <Dialog open={!!target} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{isEdit ? `Edit job card ${(target as JobCard).jobNumber}` : 'New job card'}</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            <Field label="Vehicle" required>
              <Dropdown
                value={selectedVehicle ? vehicleLabel(selectedVehicle) : ''}
                selectedOptions={vehicleId != null ? [String(vehicleId)] : []}
                onOptionSelect={(_, d) => setVehicleId(d.optionValue ? Number(d.optionValue) : null)}
                placeholder="Select a vehicle"
              >
                {vehicles.map((v) => (
                  <Option key={v.id} value={String(v.id)}>
                    {vehicleLabel(v)}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            {isEdit ? (
              <Field label="Job number" required>
                <Input value={jobNumber} onChange={(_, d) => setJobNumber(d.value)} />
              </Field>
            ) : (
              <Field label="Job number" hint="Generated automatically when the job card is created.">
                <Input value="" placeholder="Auto-generated" disabled />
              </Field>
            )}
            <Field label="Title" required>
              <Input value={title} onChange={(_, d) => setTitle(d.value)} />
            </Field>
            <Field label="Description">
              <Textarea value={description} onChange={(_, d) => setDescription(d.value)} />
            </Field>
            <Field label="Priority">
              <Dropdown
                value={priority}
                selectedOptions={[priority]}
                onOptionSelect={(_, d) => d.optionValue && setPriority(d.optionValue)}
              >
                {JOB_PRIORITIES.map((p) => (
                  <Option key={p} value={p}>
                    {p}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Status">
              <Dropdown
                value={status}
                selectedOptions={[status]}
                onOptionSelect={(_, d) => d.optionValue && setStatus(d.optionValue)}
              >
                {JOB_STATUSES.map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            {users.length > 0 && (
              <Field label="Assigned to">
                <Dropdown
                  value={assignedUserLabel}
                  selectedOptions={assignedToUserId != null ? [String(assignedToUserId)] : ['']}
                  onOptionSelect={(_, d) =>
                    setAssignedToUserId(d.optionValue ? Number(d.optionValue) : null)
                  }
                  placeholder="Unassigned"
                >
                  <Option value="">Unassigned</Option>
                  {users.map((u) => (
                    <Option key={u.id} value={String(u.id)}>
                      {u.fullName || u.username}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            )}
            <Field label="Estimated cost">
              <Input
                type="number"
                value={estimatedCost}
                onChange={(_, d) => setEstimatedCost(d.value)}
                contentBefore="R"
              />
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={submit} disabled={saving}>
              {saving ? <Spinner size="tiny" /> : isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

function TasksDialog({ job, onClose }: { job: JobCard | null; onClose: () => void }) {
  const [tasks, setTasks] = useState<JobCardTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async (jobCardId: number) => {
    setLoading(true);
    setError(null);
    try {
      setTasks(await getTasksByJobCard(jobCardId));
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to load tasks.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (job) {
      setNewTaskName('');
      load(job.id);
    }
  }, [job]);

  const addTask = async () => {
    if (!job || !newTaskName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await createJobCardTask({ jobCardId: job.id, taskName: newTaskName.trim(), isCompleted: false });
      setNewTaskName('');
      await load(job.id);
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to add task.'));
    } finally {
      setBusy(false);
    }
  };

  const toggleTask = async (task: JobCardTask) => {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      await updateJobCardTask(task.id, { ...task, isCompleted: !task.isCompleted });
      await load(job.id);
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to update task.'));
    } finally {
      setBusy(false);
    }
  };

  const removeTask = async (task: JobCardTask) => {
    if (!job) return;
    setBusy(true);
    setError(null);
    try {
      await deleteJobCardTask(task.id);
      await load(job.id);
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to delete task.'));
    } finally {
      setBusy(false);
    }
  };

  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <Dialog open={!!job} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>
            Tasks — {job?.jobNumber}
            {tasks.length > 0 && ` (${completedCount}/${tasks.length} complete)`}
          </DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}

            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <Field label="New task" style={{ flex: 1 }}>
                <Input
                  value={newTaskName}
                  onChange={(_, d) => setNewTaskName(d.value)}
                  placeholder="Describe the task…"
                />
              </Field>
              <Button
                appearance="primary"
                icon={<Add24Regular />}
                onClick={addTask}
                disabled={busy || !newTaskName.trim()}
              >
                Add
              </Button>
            </div>

            {loading ? (
              <Spinner label="Loading tasks…" />
            ) : tasks.length === 0 ? (
              <MessageBar intent="info">
                <MessageBarBody>No tasks yet. Add one above.</MessageBarBody>
              </MessageBar>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                  >
                    <Checkbox
                      checked={task.isCompleted}
                      disabled={busy}
                      onChange={() => toggleTask(task)}
                      label={task.taskName}
                    />
                    <div style={{ flex: 1 }} />
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<Delete24Regular />}
                      aria-label="Delete task"
                      disabled={busy}
                      onClick={() => removeTask(task)}
                    />
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Close
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
