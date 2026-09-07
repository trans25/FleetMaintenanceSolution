import { useEffect, useRef, useState } from 'react';
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
import {
  Add24Regular,
  ArrowDownload24Regular,
  ArrowUpload24Regular
} from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { RowActions } from '../components/RowActions';
import { useServerListView } from '../hooks/useServerListView';
import {
  createComplianceDocument,
  deleteComplianceDocument,
  downloadComplianceFile,
  queryComplianceDocuments,
  updateComplianceDocument,
  uploadComplianceFile
} from '../services/complianceService';
import { getVehicles } from '../services/vehicleService';
import { apiErrorMessage } from '../api/client';
import type { ComplianceDocument, Vehicle } from '../api/types';

const DOCUMENT_TYPES = [
  'LicenseDisk',
  'Insurance',
  'RoadworthyCertificate',
  'PermitDisc',
  'OperatingLicense',
  'Other'
];
const STATUSES = ['Valid', 'Expiring', 'Expired'];

function toDateInput(value?: string | null): string {
  if (!value) return '';
  return value.length >= 10 ? value.substring(0, 10) : value;
}

export default function CompliancePage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ComplianceDocument | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const uploadTargetRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const view = useServerListView<ComplianceDocument>({
    initialPageSize: 20,
    filters: [
      {
        key: 'documentType',
        label: 'Type',
        options: DOCUMENT_TYPES.map((t) => ({ value: t, label: t })),
        predicate: () => true // filtering happens on the server
      },
      {
        key: 'status',
        label: 'Status',
        options: STATUSES.map((s) => ({ value: s, label: s })),
        predicate: () => true // filtering happens on the server
      }
    ],
    fetchPage: async ({ page, pageSize, search, filterValues }) => {
      const result = await queryComplianceDocuments({
        page,
        pageSize,
        search,
        documentType: filterValues.documentType,
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

  useEffect(() => {
    void (async () => {
      setVehicles(await getVehicles().catch(() => []));
    })();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  const openEdit = (doc: ComplianceDocument) => {
    setEditTarget(doc);
    setDialogOpen(true);
  };

  const triggerUpload = (id: number) => {
    uploadTargetRef.current = id;
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const id = uploadTargetRef.current;
    e.target.value = '';
    if (!file || id == null) return;
    setActionError(null);
    try {
      await uploadComplianceFile(id, file);
      await load();
    } catch (err) {
      setActionError(apiErrorMessage(err));
    }
  };

  const onDownload = async (doc: ComplianceDocument) => {
    setActionError(null);
    try {
      const blob = await downloadComplianceFile(doc.id);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.fileName ?? `document-${doc.id}`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setActionError(apiErrorMessage(err));
    }
  };

  const columns: TableColumnDefinition<ComplianceDocument>[] = [
    createTableColumn<ComplianceDocument>({
      columnId: 'name',
      renderHeaderCell: () => 'Document',
      renderCell: (d) => d.name
    }),
    createTableColumn<ComplianceDocument>({
      columnId: 'documentType',
      renderHeaderCell: () => 'Type',
      renderCell: (d) => d.documentType
    }),
    createTableColumn<ComplianceDocument>({
      columnId: 'vehicle',
      renderHeaderCell: () => 'Vehicle',
      renderCell: (d) =>
        d.vehicleRegistration ??
        vehicles.find((v) => v.id === d.vehicleId)?.registrationNumber ??
        `#${d.vehicleId}`
    }),
    createTableColumn<ComplianceDocument>({
      columnId: 'expiry',
      renderHeaderCell: () => 'Expires',
      renderCell: (d) => toDateInput(d.expiryDate)
    }),
    createTableColumn<ComplianceDocument>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (d) => <StatusBadge value={d.status} />
    }),
    createTableColumn<ComplianceDocument>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (d) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button
            size="small"
            icon={<ArrowUpload24Regular />}
            onClick={() => triggerUpload(d.id)}
          >
            Upload
          </Button>
          <Button
            size="small"
            icon={<ArrowDownload24Regular />}
            onClick={() => void onDownload(d)}
            disabled={!d.hasFile}
          >
            File
          </Button>
          <Button size="small" onClick={() => openEdit(d)}>
            Edit
          </Button>
          <RowActions
            onDelete={async () => {
              await deleteComplianceDocument(d.id);
              await load();
            }}
            deleteConfirm={`Delete document "${d.name}"? This cannot be undone.`}
          />
        </div>
      )
    })
  ];

  const loading = view.loading;
  const error = actionError ?? view.error;

  return (
    <>
      <PageHeader
        title="Compliance Documents"
        subtitle="Track vehicle licenses, insurance and certificates with expiry alerts."
        actions={
          <Button
            appearance="primary"
            icon={<Add24Regular />}
            onClick={openCreate}
            disabled={vehicles.length === 0}
          >
            Add document
          </Button>
        }
      />
      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {loading ? (
        <Spinner label="Loading documents…" />
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder="Search document, vehicle…" />
          <DataGrid items={view.pageItems} columns={columns} getRowId={(d) => d.id}>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<ComplianceDocument>>
              {({ item, rowId }) => (
                <DataGridRow<ComplianceDocument> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
          <Pagination view={view} noun="documents" />
        </>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.gif,.tif,.tiff,.doc,.docx"
        style={{ display: 'none' }}
        onChange={onFileSelected}
      />

      <ComplianceDialog
        open={dialogOpen}
        vehicles={vehicles}
        document={editTarget}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          void load();
        }}
      />
    </>
  );
}

interface DialogProps {
  open: boolean;
  vehicles: Vehicle[];
  document: ComplianceDocument | null;
  onClose: () => void;
  onSaved: () => void;
}

function ComplianceDialog({ open, vehicles, document, onClose, onSaved }: DialogProps) {
  const isEdit = document != null;
  const [vehicleId, setVehicleId] = useState<number | null>(null);
  const [documentType, setDocumentType] = useState(DOCUMENT_TYPES[0]);
  const [name, setName] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (document) {
      setVehicleId(document.vehicleId);
      setDocumentType(document.documentType);
      setName(document.name);
      setDocumentNumber(document.documentNumber ?? '');
      setIssueDate(toDateInput(document.issueDate));
      setExpiryDate(toDateInput(document.expiryDate));
      setNotes(document.notes ?? '');
    } else {
      setVehicleId(vehicles[0]?.id ?? null);
      setDocumentType(DOCUMENT_TYPES[0]);
      setName('');
      setDocumentNumber('');
      setIssueDate('');
      setExpiryDate('');
      setNotes('');
    }
  }, [open, document, vehicles]);

  const canSave = name.trim() !== '' && issueDate !== '' && expiryDate !== '' && (isEdit || vehicleId != null);

  const onSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      if (isEdit && document) {
        await updateComplianceDocument({
          id: document.id,
          documentType,
          name: name.trim(),
          documentNumber: documentNumber.trim() || null,
          issueDate,
          expiryDate,
          notes: notes.trim() || null
        });
      } else if (vehicleId != null) {
        await createComplianceDocument({
          vehicleId,
          documentType,
          name: name.trim(),
          documentNumber: documentNumber.trim() || null,
          issueDate,
          expiryDate,
          notes: notes.trim() || null
        });
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(_, data) => !data.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{isEdit ? 'Edit document' : 'Add compliance document'}</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            {!isEdit && (
              <Field label="Vehicle" required>
                <Dropdown
                  value={
                    vehicles.find((v) => v.id === vehicleId)?.registrationNumber ?? ''
                  }
                  selectedOptions={vehicleId != null ? [String(vehicleId)] : []}
                  onOptionSelect={(_, data) =>
                    setVehicleId(data.optionValue ? Number(data.optionValue) : null)
                  }
                >
                  {vehicles.map((v) => (
                    <Option key={v.id} value={String(v.id)}>
                      {v.registrationNumber}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
            )}
            <Field label="Document type" required>
              <Dropdown
                value={documentType}
                selectedOptions={[documentType]}
                onOptionSelect={(_, data) => data.optionValue && setDocumentType(data.optionValue)}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <Option key={t} value={t}>
                    {t}
                  </Option>
                ))}
              </Dropdown>
            </Field>
            <Field label="Name" required>
              <Input value={name} onChange={(_, d) => setName(d.value)} />
            </Field>
            <Field label="Document number">
              <Input value={documentNumber} onChange={(_, d) => setDocumentNumber(d.value)} />
            </Field>
            <Field label="Issue date" required>
              <Input type="date" value={issueDate} onChange={(_, d) => setIssueDate(d.value)} />
            </Field>
            <Field label="Expiry date" required>
              <Input type="date" value={expiryDate} onChange={(_, d) => setExpiryDate(d.value)} />
            </Field>
            <Field label="Notes">
              <Textarea value={notes} onChange={(_, d) => setNotes(d.value)} />
            </Field>
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={() => void onSubmit()} disabled={!canSave || saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
