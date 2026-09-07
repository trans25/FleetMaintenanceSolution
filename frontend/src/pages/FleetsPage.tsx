import { useState } from 'react';
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
  Switch,
  Textarea,
  createTableColumn,
  type TableColumnDefinition
} from '@fluentui/react-components';
import { Add24Regular, ArrowUpload24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { RowActions } from '../components/RowActions';
import { ImportDialog } from '../components/ImportDialog';
import { useServerListView } from '../hooks/useServerListView';
import { createFleet, deleteFleet, importFleets, queryFleets } from '../services/fleetService';
import { useAuth } from '../auth/AuthContext';
import { apiErrorMessage } from '../api/client';
import type { Fleet } from '../api/types';

export default function FleetsPage() {
  const [open, setOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  // Server-side search + filter + pagination so the list scales to large tenants.
  const view = useServerListView<Fleet>({
    initialPageSize: 20,
    filters: [
      {
        key: 'active',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ],
        predicate: () => true // filtering happens on the server
      }
    ],
    fetchPage: async ({ page, pageSize, search, filterValues }) => {
      const active = filterValues.active;
      const result = await queryFleets({
        page,
        pageSize,
        search,
        isActive: active === 'active' ? true : active === 'inactive' ? false : undefined
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

  const columns: TableColumnDefinition<Fleet>[] = [
    createTableColumn<Fleet>({
      columnId: 'name',
      renderHeaderCell: () => 'Name',
      renderCell: (f) => f.name
    }),
    createTableColumn<Fleet>({
      columnId: 'location',
      renderHeaderCell: () => 'Location',
      renderCell: (f) => f.location ?? '—'
    }),
    createTableColumn<Fleet>({
      columnId: 'vehicles',
      renderHeaderCell: () => 'Vehicles',
      renderCell: (f) => f.vehicleCount ?? '—'
    }),
    createTableColumn<Fleet>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (f) => <StatusBadge value={f.isActive ? 'Active' : 'Inactive'} />
    }),
    createTableColumn<Fleet>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (f) => (
        <RowActions
          onDelete={async () => {
            await deleteFleet(f.id);
            await load();
          }}
          deleteConfirm={`Delete fleet ${f.name}? This cannot be undone.`}
        />
      )
    })
  ];

  return (
    <>
      <PageHeader
        title="Fleets"
        subtitle="Groups of vehicles you operate and maintain."
        actions={
          <>
            <Button icon={<ArrowUpload24Regular />} onClick={() => setImportOpen(true)}>
              Import CSV
            </Button>
            <Button appearance="primary" icon={<Add24Regular />} onClick={() => setOpen(true)}>
              New fleet
            </Button>
          </>
        }
      />
      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {loading ? (
        <Spinner label="Loading fleets…" />
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder="Search name, location…" />
          <DataGrid items={view.pageItems} columns={columns} getRowId={(f) => f.id} sortable>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Fleet>>
              {({ item, rowId }) => (
                <DataGridRow<Fleet> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
          <Pagination view={view} noun="fleets" />
        </>
      )}

      <NewFleetDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          void load();
        }}
      />

      <ImportDialog
        open={importOpen}
        title="Import fleets"
        columnsHint="Name,Description,Location,IsActive"
        onImport={importFleets}
        onClose={() => setImportOpen(false)}
        onImported={() => void load()}
      />
    </>
  );
}

function NewFleetDialog({
  open,
  onClose,
  onCreated
}: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { tenantId } = useAuth();
  const [form, setForm] = useState({ name: '', location: '', description: '', isActive: true });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      await createFleet({ ...form, tenantId: tenantId ?? undefined });
      setForm({ name: '', location: '', description: '', isActive: true });
      onCreated();
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to create fleet.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>New fleet</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            <Field label="Name" required>
              <Input value={form.name} onChange={(_, d) => setForm((f) => ({ ...f, name: d.value }))} />
            </Field>
            <Field label="Location">
              <Input
                value={form.location}
                onChange={(_, d) => setForm((f) => ({ ...f, location: d.value }))}
              />
            </Field>
            <Field label="Description">
              <Textarea
                value={form.description}
                onChange={(_, d) => setForm((f) => ({ ...f, description: d.value }))}
              />
            </Field>
            <Switch
              checked={form.isActive}
              label="Active"
              onChange={(_, d) => setForm((f) => ({ ...f, isActive: d.checked }))}
            />
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={submit} disabled={saving || !form.name}>
              {saving ? <Spinner size="tiny" /> : 'Create'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
