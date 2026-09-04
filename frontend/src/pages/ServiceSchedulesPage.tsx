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
import { Add24Regular, CheckmarkCircle24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { useListView } from '../hooks/useListView';
import {
  createServiceSchedule,
  getServiceSchedules,
  updateServiceSchedule
} from '../services/serviceScheduleService';
import { getVehicles } from '../services/vehicleService';
import { apiErrorMessage } from '../api/client';
import type { ServiceSchedule, Vehicle } from '../api/types';

const SERVICE_TYPES = ['Routine Service', 'Oil Change', 'Tyre Rotation', 'Brake Service', 'Inspection', 'Repair'];

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function ServiceSchedulesPage() {
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, v] = await Promise.all([getServiceSchedules(), getVehicles().catch(() => [])]);
      setSchedules(s);
      setVehicles(v);
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to load service schedules.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const markComplete = async (s: ServiceSchedule) => {
    try {
      await updateServiceSchedule(s.id, {
        ...s,
        status: 'Completed',
        completedDate: new Date().toISOString()
      });
      await load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to update schedule.'));
    }
  };

  const view = useListView<ServiceSchedule>({
    items: schedules,
    searchFields: (s) => [s.vehicleRegistration, s.serviceType, s.description, s.notes],
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'Scheduled', label: 'Scheduled' },
          { value: 'Completed', label: 'Completed' },
          { value: 'Cancelled', label: 'Cancelled' }
        ],
        predicate: (s, value) => (s.status ?? '').toLowerCase() === value.toLowerCase()
      }
    ]
  });

  const columns: TableColumnDefinition<ServiceSchedule>[] = [
    createTableColumn<ServiceSchedule>({
      columnId: 'vehicle',
      renderHeaderCell: () => 'Vehicle',
      renderCell: (s) => s.vehicleRegistration ?? `#${s.vehicleId}`
    }),
    createTableColumn<ServiceSchedule>({
      columnId: 'type',
      renderHeaderCell: () => 'Service type',
      renderCell: (s) => s.serviceType
    }),
    createTableColumn<ServiceSchedule>({
      columnId: 'scheduled',
      renderHeaderCell: () => 'Scheduled',
      renderCell: (s) => fmtDate(s.scheduledDate)
    }),
    createTableColumn<ServiceSchedule>({
      columnId: 'completed',
      renderHeaderCell: () => 'Completed',
      renderCell: (s) => fmtDate(s.completedDate)
    }),
    createTableColumn<ServiceSchedule>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (s) => <StatusBadge value={s.status} />
    }),
    createTableColumn<ServiceSchedule>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (s) =>
        (s.status ?? '').toLowerCase() === 'scheduled' ? (
          <Button
            size="small"
            icon={<CheckmarkCircle24Regular />}
            onClick={() => void markComplete(s)}
          >
            Complete
          </Button>
        ) : (
          <span>—</span>
        )
    })
  ];

  return (
    <>
      <PageHeader
        title="Service Schedules"
        subtitle="Plan and track preventive maintenance across your fleet."
        actions={
          <Button appearance="primary" icon={<Add24Regular />} onClick={() => setOpen(true)}>
            Schedule service
          </Button>
        }
      />
      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {loading ? (
        <Spinner label="Loading schedules…" />
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder="Search vehicle, type…" />
          <DataGrid items={view.pageItems} columns={columns} getRowId={(s) => s.id} sortable>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<ServiceSchedule>>
              {({ item, rowId }) => (
                <DataGridRow<ServiceSchedule> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
          <Pagination view={view} noun="schedules" />
        </>
      )}

      <ScheduleDialog
        open={open}
        vehicles={vehicles}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          void load();
        }}
      />
    </>
  );
}

function ScheduleDialog({
  open,
  vehicles,
  onClose,
  onCreated
}: {
  open: boolean;
  vehicles: Vehicle[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [serviceType, setServiceType] = useState(SERVICE_TYPES[0]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!vehicleId) {
      setError('Please select a vehicle.');
      return;
    }
    if (!scheduledDate) {
      setError('Please choose a scheduled date.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await createServiceSchedule({
        vehicleId,
        serviceType,
        description,
        scheduledDate: new Date(scheduledDate).toISOString(),
        status: 'Scheduled',
        notes
      });
      setVehicleId(null);
      setServiceType(SERVICE_TYPES[0]);
      setScheduledDate('');
      setDescription('');
      setNotes('');
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to schedule service.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Schedule service</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            <Field label="Vehicle" required>
              <Dropdown
                placeholder="Select a vehicle"
                selectedOptions={vehicleId ? [String(vehicleId)] : []}
                value={
                  vehicleId
                    ? vehicles.find((v) => v.id === vehicleId)?.registrationNumber ?? ''
                    : ''
                }
                onOptionSelect={(_, d) => setVehicleId(d.optionValue ? Number(d.optionValue) : null)}
              >
                {vehicles.map((v) => (
                  <Option key={v.id} value={String(v.id)} text={v.registrationNumber}>
                    {v.registrationNumber} — {v.model}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Service type" required>
              <Dropdown
                selectedOptions={[serviceType]}
                value={serviceType}
                onOptionSelect={(_, d) => d.optionValue && setServiceType(d.optionValue)}
              >
                {SERVICE_TYPES.map((t) => (
                  <Option key={t} value={t}>
                    {t}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Scheduled date" required>
              <Input
                type="date"
                value={scheduledDate}
                onChange={(_, d) => setScheduledDate(d.value)}
              />
            </Field>
            <Field label="Description">
              <Input value={description} onChange={(_, d) => setDescription(d.value)} />
            </Field>
            <Field label="Notes">
              <Textarea value={notes} onChange={(_, d) => setNotes(d.value)} />
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={() => void submit()} disabled={saving}>
              {saving ? 'Saving…' : 'Schedule'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
