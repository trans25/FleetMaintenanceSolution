import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  createTableColumn,
  type TableColumnDefinition
} from '@fluentui/react-components';
import { Add24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { RowActions } from '../components/RowActions';
import { useServerListView } from '../hooks/useServerListView';
import { createVehicle, deleteVehicle, queryVehicles } from '../services/vehicleService';
import { getFleets } from '../services/fleetService';
import { getManufacturers } from '../services/manufacturerService';
import { apiErrorMessage } from '../api/client';
import type { Fleet, Manufacturer, Vehicle } from '../api/types';

const VEHICLE_STATUSES = ['Available', 'Maintenance', 'OutOfService', 'Retired'];

export default function VehiclesPage() {
  const navigate = useNavigate();
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [open, setOpen] = useState(false);

  // Server-side search + filter + pagination so the list scales to large fleets.
  const view = useServerListView<Vehicle>({
    initialPageSize: 20,
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: VEHICLE_STATUSES.map((s) => ({ value: s, label: s })),
        predicate: () => true // filtering happens on the server
      }
    ],
    fetchPage: async ({ page, pageSize, search, filterValues }) => {
      const result = await queryVehicles({
        page,
        pageSize,
        search,
        status: filterValues.status
      });
      return {
        items: result.items,
        totalCount: result.totalCount,
        totalPages: result.totalPages
      };
    }
  });

  const load = () => view.refresh();

  // Reference-data for the Add dialog (small lists; loaded once).
  useEffect(() => {
    void (async () => {
      const [f, m] = await Promise.all([
        getFleets().catch(() => []),
        getManufacturers().catch(() => [])
      ]);
      setFleets(f);
      setManufacturers(m);
    })();
  }, []);

  const loading = view.loading;
  const error = view.error;

  const columns: TableColumnDefinition<Vehicle>[] = [
    createTableColumn<Vehicle>({
      columnId: 'reg',
      renderHeaderCell: () => 'Registration',
      renderCell: (v) => v.registrationNumber
    }),
    createTableColumn<Vehicle>({
      columnId: 'model',
      renderHeaderCell: () => 'Model',
      renderCell: (v) => `${v.model}${v.year ? ` (${v.year})` : ''}`
    }),
    createTableColumn<Vehicle>({
      columnId: 'vin',
      renderHeaderCell: () => 'VIN',
      renderCell: (v) => v.vin
    }),
    createTableColumn<Vehicle>({
      columnId: 'mileage',
      renderHeaderCell: () => 'Mileage',
      renderCell: (v) => (v.mileage != null ? v.mileage.toLocaleString() : '—')
    }),
    createTableColumn<Vehicle>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (v) => <StatusBadge value={v.status} />
    }),
    createTableColumn<Vehicle>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (v) => (
        <RowActions
          onView={() => navigate(`/vehicles/${v.id}`)}
          onDelete={async () => {
            await deleteVehicle(v.id);
            await load();
          }}
          deleteConfirm={`Delete vehicle ${v.registrationNumber}? This cannot be undone.`}
        />
      )
    })
  ];

  return (
    <>
      <PageHeader
        title="Vehicles"
        subtitle="Every asset in your fleets, with live maintenance status."
        actions={
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={() => setOpen(true)}
            disabled={fleets.length === 0 || manufacturers.length === 0}
          >
            Add vehicle
          </Button>
        }
      />
      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {loading ? (
        <Spinner label="Loading vehicles…" />
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder="Search registration, model, VIN…" />
          <DataGrid items={view.pageItems} columns={columns} getRowId={(v) => v.id} sortable>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Vehicle>>
              {({ item, rowId }) => (
                <DataGridRow<Vehicle> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
          <Pagination view={view} noun="vehicles" />
        </>
      )}

      <NewVehicleDialog
        open={open}
        fleets={fleets}
        manufacturers={manufacturers}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          void load();
        }}
      />
    </>
  );
}

function NewVehicleDialog({
  open,
  fleets,
  manufacturers,
  onClose,
  onCreated
}: {
  open: boolean;
  fleets: Fleet[];
  manufacturers: Manufacturer[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({
    fleetId: 0,
    manufacturerId: 0,
    registrationNumber: '',
    vin: '',
    model: '',
    year: '',
    mileage: '',
    status: 'Available'
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      await createVehicle({
        fleetId: form.fleetId,
        manufacturerId: form.manufacturerId,
        registrationNumber: form.registrationNumber,
        vin: form.vin,
        model: form.model,
        year: form.year ? Number(form.year) : undefined,
        mileage: form.mileage ? Number(form.mileage) : undefined,
        status: form.status
      });
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to add vehicle.'));
    } finally {
      setSaving(false);
    }
  };

  const valid =
    form.fleetId > 0 &&
    form.manufacturerId > 0 &&
    form.registrationNumber &&
    form.vin &&
    form.model;

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>Add vehicle</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            <Field label="Fleet" required>
              <Dropdown
                placeholder="Select a fleet"
                onOptionSelect={(_, d) => setForm((f) => ({ ...f, fleetId: Number(d.optionValue) }))}
              >
                {fleets.map((fl) => (
                  <Option key={fl.id} value={String(fl.id)}>
                    {fl.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Manufacturer" required>
              <Dropdown
                placeholder="Select a manufacturer"
                onOptionSelect={(_, d) =>
                  setForm((f) => ({ ...f, manufacturerId: Number(d.optionValue) }))
                }
              >
                {manufacturers.map((m) => (
                  <Option key={m.id} value={String(m.id)}>
                    {m.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <div style={{ display: 'flex', gap: 12 }}>
              <Field label="Registration" required style={{ flex: 1 }}>
                <Input
                  value={form.registrationNumber}
                  onChange={(_, d) => setForm((f) => ({ ...f, registrationNumber: d.value }))}
                />
              </Field>
              <Field label="VIN" required style={{ flex: 1 }}>
                <Input value={form.vin} onChange={(_, d) => setForm((f) => ({ ...f, vin: d.value }))} />
              </Field>
            </div>
            <Field label="Model" required>
              <Input value={form.model} onChange={(_, d) => setForm((f) => ({ ...f, model: d.value }))} />
            </Field>
            <div style={{ display: 'flex', gap: 12 }}>
              <Field label="Year" style={{ flex: 1 }}>
                <Input
                  type="number"
                  value={form.year}
                  onChange={(_, d) => setForm((f) => ({ ...f, year: d.value }))}
                />
              </Field>
              <Field label="Mileage" style={{ flex: 1 }}>
                <Input
                  type="number"
                  value={form.mileage}
                  onChange={(_, d) => setForm((f) => ({ ...f, mileage: d.value }))}
                />
              </Field>
            </div>
            <Field label="Status">
              <Dropdown
                value={form.status}
                selectedOptions={[form.status]}
                onOptionSelect={(_, d) => setForm((f) => ({ ...f, status: d.optionValue ?? 'Available' }))}
              >
                {VEHICLE_STATUSES.map((s) => (
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
            <Button appearance="primary" onClick={submit} disabled={saving || !valid}>
              {saving ? <Spinner size="tiny" /> : 'Add'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
