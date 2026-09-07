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
import { Add24Regular, WrenchScrewdriver24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { RowActions } from '../components/RowActions';
import { useServerListView } from '../hooks/useServerListView';
import { convertFaultToJobCard, deleteFault, queryFaults, reportFault } from '../services/faultService';
import { getVehicles } from '../services/vehicleService';
import { apiErrorMessage } from '../api/client';
import type { Fault, Vehicle } from '../api/types';

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];
const FAULT_STATUSES = ['Open', 'Reported', 'InProgress', 'Resolved'];

export default function FaultsPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [open, setOpen] = useState(false);
  const [convertTarget, setConvertTarget] = useState<Fault | null>(null);

  // Server-side search + filter + pagination so the list scales.
  const view = useServerListView<Fault>({
    initialPageSize: 20,
    filters: [
      {
        key: 'severity',
        label: 'Severity',
        options: SEVERITIES.map((s) => ({ value: s, label: s })),
        predicate: () => true // filtering happens on the server
      },
      {
        key: 'status',
        label: 'Status',
        options: FAULT_STATUSES.map((s) => ({ value: s, label: s })),
        predicate: () => true // filtering happens on the server
      }
    ],
    fetchPage: async ({ page, pageSize, search, filterValues }) => {
      const result = await queryFaults({
        page,
        pageSize,
        search,
        status: filterValues.status,
        severity: filterValues.severity
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
  const error = view.error;

  // Reference-data for the report dialog and registration display.
  useEffect(() => {
    void (async () => {
      setVehicles(await getVehicles().catch(() => []));
    })();
  }, []);

  const columns: TableColumnDefinition<Fault>[] = [
    createTableColumn<Fault>({
      columnId: 'title',
      renderHeaderCell: () => 'Fault',
      renderCell: (f) => f.title
    }),
    createTableColumn<Fault>({
      columnId: 'vehicle',
      renderHeaderCell: () => 'Vehicle',
      renderCell: (f) =>
        f.vehicleRegistration ??
        vehicles.find((v) => v.id === f.vehicleId)?.registrationNumber ??
        `#${f.vehicleId}`
    }),
    createTableColumn<Fault>({
      columnId: 'severity',
      renderHeaderCell: () => 'Severity',
      renderCell: (f) => <StatusBadge value={f.severity} />
    }),
    createTableColumn<Fault>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (f) => <StatusBadge value={f.status} />
    }),
    createTableColumn<Fault>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (f) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            size="small"
            icon={<WrenchScrewdriver24Regular />}
            onClick={() => setConvertTarget(f)}
            disabled={(f.status ?? '').toLowerCase() === 'resolved'}
          >
            Create job card
          </Button>
          <RowActions
            onDelete={async () => {
              await deleteFault(f.id);
              await load();
            }}
            deleteConfirm={`Delete fault "${f.title}"? This cannot be undone.`}
          />
        </div>
      )
    })
  ];

  return (
    <>
      <PageHeader
        title="Faults"
        subtitle="Reported defects awaiting triage and repair."
        actions={
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={() => setOpen(true)}
            disabled={vehicles.length === 0}
          >
            Report fault
          </Button>
        }
      />
      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {loading ? (
        <Spinner label="Loading faults…" />
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder="Search fault, vehicle…" />
          <DataGrid items={view.pageItems} columns={columns} getRowId={(f) => f.id}>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Fault>>
              {({ item, rowId }) => (
                <DataGridRow<Fault> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
          <Pagination view={view} noun="faults" />
        </>
      )}

      <ReportFaultDialog
        open={open}
        vehicles={vehicles}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          void load();
        }}
      />
      <ConvertDialog
        fault={convertTarget}
        onClose={() => setConvertTarget(null)}
        onConverted={() => {
          setConvertTarget(null);
          void load();
        }}
      />
    </>
  );
}

function ReportFaultDialog({
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
  const [form, setForm] = useState({ vehicleId: 0, title: '', description: '', severity: 'Medium' });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      await reportFault({
        vehicleId: form.vehicleId,
        title: form.title,
        description: form.description,
        severity: form.severity,
        status: 'Open'
      });
      setForm({ vehicleId: 0, title: '', description: '', severity: 'Medium' });
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to report fault.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Report fault</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            <Field label="Vehicle" required>
              <Dropdown
                placeholder="Select a vehicle"
                onOptionSelect={(_, d) => setForm((f) => ({ ...f, vehicleId: Number(d.optionValue) }))}
              >
                {vehicles.map((v) => (
                  <Option key={v.id} value={String(v.id)} text={`${v.registrationNumber} — ${v.model}`}>
                    {v.registrationNumber} — {v.model}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Title" required>
              <Input value={form.title} onChange={(_, d) => setForm((f) => ({ ...f, title: d.value }))} />
            </Field>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(_, d) => setForm((f) => ({ ...f, description: d.value }))}
              />
            </Field>
            <Field label="Severity">
              <Dropdown
                value={form.severity}
                selectedOptions={[form.severity]}
                onOptionSelect={(_, d) => setForm((f) => ({ ...f, severity: d.optionValue ?? 'Medium' }))}
              >
                {SEVERITIES.map((s) => (
                  <Option key={s} value={s}>
                    {s}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              appearance="primary"
              onClick={submit}
              disabled={saving || !form.vehicleId || !form.title}
            >
              {saving ? <Spinner size="tiny" /> : 'Report'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}

function ConvertDialog({
  fault,
  onClose,
  onConverted
}: {
  fault: Fault | null;
  onClose: () => void;
  onConverted: () => void;
}) {
  const [estimatedCost, setEstimatedCost] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!fault) return;
    setError(null);
    setSaving(true);
    try {
      await convertFaultToJobCard(fault.id, { estimatedCost: Number(estimatedCost) || 0 });
      setEstimatedCost('');
      onConverted();
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to create job card.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!fault} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Create job card from fault</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            <p style={{ margin: 0 }}>{fault?.title}</p>
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
              {saving ? <Spinner size="tiny" /> : 'Create job card'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
