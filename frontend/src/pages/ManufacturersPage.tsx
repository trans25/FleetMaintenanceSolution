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
import { Add24Regular, Edit24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { RowActions } from '../components/RowActions';
import { useListView } from '../hooks/useListView';
import {
  createManufacturer,
  deleteManufacturer,
  getManufacturers,
  updateManufacturer,
  type ManufacturerPayload
} from '../services/manufacturerService';
import { apiErrorMessage } from '../api/client';
import type { Manufacturer } from '../api/types';

const emptyForm: ManufacturerPayload = { name: '', country: '', website: '' };

export default function ManufacturersPage() {
  const [items, setItems] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ManufacturerPayload>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getManufacturers());
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to load manufacturers.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const view = useListView<Manufacturer>({
    items,
    searchFields: (m) => [m.name, m.country, m.website],
    initialPageSize: 10
  });

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEdit = (m: Manufacturer) => {
    setEditingId(m.id);
    setForm({ name: m.name, country: m.country ?? '', website: m.website ?? '' });
    setFormError(null);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      setFormError('Name is required.');
      return;
    }
    setSaving(true);
    setFormError(null);
    try {
      const payload: ManufacturerPayload = {
        name: form.name.trim(),
        country: form.country?.trim() || null,
        website: form.website?.trim() || null
      };
      if (editingId == null) {
        await createManufacturer(payload);
      } else {
        await updateManufacturer(editingId, payload);
      }
      setDialogOpen(false);
      await load();
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Unable to save manufacturer.'));
    } finally {
      setSaving(false);
    }
  };

  const columns: TableColumnDefinition<Manufacturer>[] = [
    createTableColumn<Manufacturer>({
      columnId: 'name',
      renderHeaderCell: () => 'Name',
      renderCell: (m) => m.name
    }),
    createTableColumn<Manufacturer>({
      columnId: 'country',
      renderHeaderCell: () => 'Country',
      renderCell: (m) => m.country ?? '—'
    }),
    createTableColumn<Manufacturer>({
      columnId: 'website',
      renderHeaderCell: () => 'Website',
      renderCell: (m) =>
        m.website ? (
          <a href={m.website} target="_blank" rel="noreferrer">
            {m.website}
          </a>
        ) : (
          '—'
        )
    }),
    createTableColumn<Manufacturer>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (m) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Button
            appearance="subtle"
            size="small"
            icon={<Edit24Regular />}
            aria-label="Edit manufacturer"
            onClick={() => openEdit(m)}
          />
          <RowActions
            onDelete={async () => {
              await deleteManufacturer(m.id);
              await load();
            }}
            deleteConfirm={`Delete manufacturer ${m.name}? This cannot be undone.`}
          />
        </div>
      )
    })
  ];

  return (
    <>
      <PageHeader
        title="Manufacturers"
        subtitle="Vehicle makes available when registering vehicles."
        actions={
          <Button appearance="primary" icon={<Add24Regular />} onClick={openCreate}>
            New manufacturer
          </Button>
        }
      />

      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      <DataToolbar view={view} searchPlaceholder="Search manufacturers…" />

      {loading ? (
        <Spinner label="Loading manufacturers…" />
      ) : (
        <>
          <DataGrid items={view.pageItems} columns={columns} getRowId={(m) => m.id}>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<Manufacturer>>
              {({ item, rowId }) => (
                <DataGridRow<Manufacturer> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
          <Pagination view={view} noun="manufacturers" />
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={(_, d) => setDialogOpen(d.open)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>{editingId == null ? 'New manufacturer' : 'Edit manufacturer'}</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {formError && (
                <MessageBar intent="error">
                  <MessageBarBody>{formError}</MessageBarBody>
                </MessageBar>
              )}
              <Field label="Name" required>
                <Input
                  value={form.name}
                  onChange={(_, d) => setForm((f) => ({ ...f, name: d.value }))}
                />
              </Field>
              <Field label="Country">
                <Input
                  value={form.country ?? ''}
                  onChange={(_, d) => setForm((f) => ({ ...f, country: d.value }))}
                />
              </Field>
              <Field label="Website">
                <Input
                  value={form.website ?? ''}
                  onChange={(_, d) => setForm((f) => ({ ...f, website: d.value }))}
                />
              </Field>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={save} disabled={saving}>
                {saving ? <Spinner size="tiny" /> : 'Save'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
