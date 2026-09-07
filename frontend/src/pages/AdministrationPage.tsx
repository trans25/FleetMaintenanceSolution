import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
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
  Text,
  createTableColumn,
  makeStyles,
  tokens,
  type TableColumnDefinition
} from '@fluentui/react-components';
import { Add24Regular, Edit24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { RowActions } from '../components/RowActions';
import { useListView } from '../hooks/useListView';
import { getFleetsByTenant, getTenants, getUsersByTenant, createTenant, updateTenant, deleteTenant, suspendTenant, activateTenant, type TenantPayload } from '../services/adminService';
import { createUser, deleteUser, getUser, updateUser } from '../services/userService';
import { queryComplianceDocuments } from '../services/complianceService';
import { getRoles } from '../services/roleService';
import { apiErrorMessage } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { AdminTenant, AdminUser, ComplianceDocument, Fleet, Role } from '../api/types';

const ADMIN_ROLES = ['SystemAdmin', 'TenantAdmin'];
const MANAGER_ROLES = ['FleetManager', 'Manager'];

const useStyles = makeStyles({
  layout: { display: 'grid', gridTemplateColumns: '1fr', rowGap: '24px' },
  section: { display: 'flex', flexDirection: 'column', rowGap: '12px' },
  card: { padding: '16px' },
  sectionTitle: { fontWeight: 600, fontSize: tokens.fontSizeBase400 },
  stat: { color: tokens.colorNeutralForeground3 }
});

export default function AdministrationPage() {
  const styles = useStyles();
  const { tenantId: currentTenantId } = useAuth();
  const [tenants, setTenants] = useState<AdminTenant[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AdminTenant | null>(null);
  const [tenantDialog, setTenantDialog] = useState<AdminTenant | 'new' | null>(null);

  const loadTenants = async () => {
    try {
      setTenants(await getTenants());
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to load tenants.'));
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [data, roleList] = await Promise.all([getTenants(), getRoles().catch(() => [])]);
        setTenants(data);
        setRoles(roleList);
      } catch (err) {
        setError(apiErrorMessage(err, 'Unable to load tenants.'));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const tenantView = useListView<AdminTenant>({
    items: tenants,
    searchFields: (t) => [t.name, t.contactEmail],
    filters: [
      {
        key: 'active',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ],
        predicate: (t, value) => (value === 'active' ? t.isActive : !t.isActive)
      }
    ]
  });

  const tenantColumns: TableColumnDefinition<AdminTenant>[] = [
    createTableColumn<AdminTenant>({
      columnId: 'name',
      renderHeaderCell: () => 'Tenant',
      renderCell: (t) => t.name
    }),
    createTableColumn<AdminTenant>({
      columnId: 'email',
      renderHeaderCell: () => 'Contact email',
      renderCell: (t) => t.contactEmail ?? '—'
    }),
    createTableColumn<AdminTenant>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (t) => <StatusBadge value={t.isActive ? 'Active' : 'Inactive'} />
    }),
    createTableColumn<AdminTenant>({
      columnId: 'actions',
      renderHeaderCell: () => '',
      renderCell: (t) => (
        <div style={{ display: 'flex', gap: 6 }}>
          <Button
            size="small"
            appearance={selected?.id === t.id ? 'primary' : 'secondary'}
            onClick={() => setSelected(t)}
          >
            {selected?.id === t.id ? 'Selected' : 'View details'}
          </Button>
          <Button size="small" icon={<Edit24Regular />} onClick={() => setTenantDialog(t)}>
            Edit
          </Button>
          {t.isActive ? (
            <Button
              size="small"
              disabled={t.id === currentTenantId}
              title={t.id === currentTenantId ? 'You cannot suspend the tenant you are signed in to.' : undefined}
              onClick={async () => {
                try {
                  setError(null);
                  await suspendTenant(t.id);
                  await loadTenants();
                } catch (err) {
                  setError(apiErrorMessage(err, 'Unable to suspend tenant.'));
                }
              }}
            >
              Suspend
            </Button>
          ) : (
            <Button
              size="small"
              onClick={async () => {
                try {
                  setError(null);
                  await activateTenant(t.id);
                  await loadTenants();
                } catch (err) {
                  setError(apiErrorMessage(err, 'Unable to activate tenant.'));
                }
              }}
            >
              Activate
            </Button>
          )}
          <RowActions
            disabled={t.id === currentTenantId}
            onDelete={async () => {
              try {
                setError(null);
                await deleteTenant(t.id);
                if (selected?.id === t.id) setSelected(null);
                await loadTenants();
              } catch (err) {
                setError(apiErrorMessage(err, 'Unable to delete tenant.'));
              }
            }}
            deleteConfirm={`Delete tenant "${t.name}"? This permanently deletes ALL of its data (users, fleets, vehicles, faults, job cards, compliance documents). This cannot be undone.`}
          />
        </div>
      )
    })
  ];

  return (
    <>
      <PageHeader
        title="Administration"
        subtitle="Manage tenants and review their admins, managers, and fleets."
        actions={
          <Button appearance="primary" icon={<Add24Regular />} onClick={() => setTenantDialog('new')}>
            New tenant
          </Button>
        }
      />
      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {loading ? (
        <Spinner label="Loading tenants…" />
      ) : (
        <div className={styles.layout}>
          <section className={styles.section}>
            <Text className={styles.sectionTitle}>Tenants</Text>
            <DataToolbar view={tenantView} searchPlaceholder="Search name, email…" />
            <DataGrid
              items={tenantView.pageItems}
              columns={tenantColumns}
              getRowId={(t) => t.id}
              sortable
            >
              <DataGridHeader>
                <DataGridRow>
                  {({ renderHeaderCell }) => (
                    <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                  )}
                </DataGridRow>
              </DataGridHeader>
              <DataGridBody<AdminTenant>>
                {({ item, rowId }) => (
                  <DataGridRow<AdminTenant> key={rowId}>
                    {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                  </DataGridRow>
                )}
              </DataGridBody>
            </DataGrid>
            <Pagination view={tenantView} noun="tenants" />
          </section>

          {selected && <TenantDetails tenant={selected} roles={roles} styles={styles} />}
        </div>
      )}

      <TenantDialog
        target={tenantDialog}
        onClose={() => setTenantDialog(null)}
        onSaved={async () => {
          setTenantDialog(null);
          await loadTenants();
        }}
      />
    </>
  );
}

function hasAnyRole(user: AdminUser, roles: string[]): boolean {
  return user.roles.some((r) => roles.includes(r));
}

function TenantDialog({
  target,
  onClose,
  onSaved
}: {
  target: AdminTenant | 'new' | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = target && target !== 'new';
  const [name, setName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!target) return;
    setError(null);
    if (target === 'new') {
      setName('');
      setContactEmail('');
      setIsActive(true);
    } else {
      setName(target.name);
      setContactEmail(target.contactEmail ?? '');
      setIsActive(target.isActive);
    }
  }, [target]);

  const submit = async () => {
    if (!name.trim() || !contactEmail.trim()) {
      setError('Name and contact email are required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload: TenantPayload = {
        name: name.trim(),
        contactEmail: contactEmail.trim(),
        isActive
      };
      if (isEdit) {
        await updateTenant((target as AdminTenant).id, payload);
      } else {
        await createTenant(payload);
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to save tenant.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{isEdit ? `Edit ${(target as AdminTenant).name}` : 'New tenant'}</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            <Field label="Name" required>
              <Input value={name} onChange={(_, d) => setName(d.value)} />
            </Field>
            <Field label="Contact email" required>
              <Input type="email" value={contactEmail} onChange={(_, d) => setContactEmail(d.value)} />
            </Field>
            <Switch
              label="Active"
              checked={isActive}
              onChange={(_, d) => setIsActive(d.checked)}
            />
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

function TenantDetails({
  tenant,
  roles,
  styles
}: {
  tenant: AdminTenant;
  roles: Role[];
  styles: ReturnType<typeof useStyles>;
}) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [compliance, setCompliance] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<AdminUser | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [u, f] = await Promise.all([
        getUsersByTenant(tenant.id),
        getFleetsByTenant(tenant.id)
      ]);
      setUsers(u);
      setFleets(f);
      const docs = await queryComplianceDocuments({ pageSize: 1000 }).catch(() => ({ items: [], totalCount: 0, page: 1, pageSize: 0 }));
      setCompliance((docs.items ?? []).filter((d) => d.tenantId === tenant.id));
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to load tenant details.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenant.id]);

  const admins = useMemo(() => users.filter((u) => hasAnyRole(u, ADMIN_ROLES)), [users]);
  const managers = useMemo(
    () => users.filter((u) => hasAnyRole(u, MANAGER_ROLES) && !hasAnyRole(u, ADMIN_ROLES)),
    [users]
  );

  const openEdit = (u: AdminUser) => {
    setEditTarget(u);
    setDialogOpen(true);
  };
  const openCreate = () => {
    setEditTarget(null);
    setDialogOpen(true);
  };

  return (
    <Card className={styles.card}>
      <div className={styles.section}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text className={styles.sectionTitle}>{tenant.name} — details</Text>
          <Button appearance="primary" icon={<Add24Regular />} onClick={openCreate}>
            New user
          </Button>
        </div>
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        {loading ? (
          <Spinner label="Loading tenant details…" />
        ) : (
          <>
            <UserSection
              title="Admins"
              noun="admins"
              users={admins}
              onEdit={openEdit}
              onDelete={async (u) => {
                await deleteUser(u.id);
                await load();
              }}
            />
            <UserSection
              title="Managers"
              noun="managers"
              users={managers}
              onEdit={openEdit}
              onDelete={async (u) => {
                await deleteUser(u.id);
                await load();
              }}
            />
            <FleetSection fleets={fleets} />
            <ComplianceSection documents={compliance} />
          </>
        )}
      </div>
      <UserDialog
        open={dialogOpen}
        tenantId={tenant.id}
        roles={roles}
        editTarget={editTarget}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          void load();
        }}
      />
    </Card>
  );
}

function UserSection({
  title,
  noun,
  users,
  onEdit,
  onDelete
}: {
  title: string;
  noun: string;
  users: AdminUser[];
  onEdit: (u: AdminUser) => void;
  onDelete: (u: AdminUser) => Promise<void>;
}) {
  const view = useListView<AdminUser>({
    items: users,
    searchFields: (u) => [u.username, u.fullName, u.email, ...u.roles],
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ],
        predicate: (u, value) => (value === 'active' ? u.isActive : !u.isActive)
      }
    ],
    initialPageSize: 5
  });

  const columns: TableColumnDefinition<AdminUser>[] = [
    createTableColumn<AdminUser>({
      columnId: 'name',
      renderHeaderCell: () => 'Name',
      renderCell: (u) => u.fullName || u.username
    }),
    createTableColumn<AdminUser>({
      columnId: 'email',
      renderHeaderCell: () => 'Email',
      renderCell: (u) => u.email
    }),
    createTableColumn<AdminUser>({
      columnId: 'roles',
      renderHeaderCell: () => 'Roles',
      renderCell: (u) => u.roles.join(', ') || '—'
    }),
    createTableColumn<AdminUser>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (u) => <StatusBadge value={u.isActive ? 'Active' : 'Inactive'} />
    }),
    createTableColumn<AdminUser>({
      columnId: 'actions',
      renderHeaderCell: () => 'Actions',
      renderCell: (u) => (
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Button size="small" onClick={() => onEdit(u)}>
            Edit
          </Button>
          <RowActions
            onDelete={() => onDelete(u)}
            deleteConfirm={`Delete user ${u.fullName || u.username}? This cannot be undone.`}
          />
        </div>
      )
    })
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      <Text weight="semibold">
        {title} ({users.length})
      </Text>
      {users.length === 0 ? (
        <Text style={{ color: tokens.colorNeutralForeground3 }}>No {noun} for this tenant.</Text>
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder={`Search ${noun}…`} />
          <DataGrid items={view.pageItems} columns={columns} getRowId={(u) => u.id}>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<AdminUser>>
              {({ item, rowId }) => (
                <DataGridRow<AdminUser> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
          <Pagination view={view} noun={noun} />
        </>
      )}
    </div>
  );
}

function FleetSection({ fleets }: { fleets: Fleet[] }) {
  const view = useListView<Fleet>({
    items: fleets,
    searchFields: (f) => [f.name, f.location, f.description],
    filters: [
      {
        key: 'active',
        label: 'Status',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ],
        predicate: (f, value) => (value === 'active' ? f.isActive : !f.isActive)
      }
    ],
    initialPageSize: 5
  });

  const columns: TableColumnDefinition<Fleet>[] = [
    createTableColumn<Fleet>({
      columnId: 'name',
      renderHeaderCell: () => 'Fleet',
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
    })
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      <Text weight="semibold">Fleets ({fleets.length})</Text>
      {fleets.length === 0 ? (
        <Text style={{ color: tokens.colorNeutralForeground3 }}>No fleets for this tenant.</Text>
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder="Search fleets…" />
          <DataGrid items={view.pageItems} columns={columns} getRowId={(f) => f.id}>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
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
    </div>
  );
}

function ComplianceSection({ documents }: { documents: ComplianceDocument[] }) {
  const view = useListView<ComplianceDocument>({
    items: documents,
    searchFields: (d) => [d.name, d.documentType, d.documentNumber ?? '', d.vehicleRegistration ?? ''],
    filters: [
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'Valid', label: 'Valid' },
          { value: 'Expiring', label: 'Expiring' },
          { value: 'Expired', label: 'Expired' }
        ],
        predicate: (d, value) => (d.status ?? '').toLowerCase() === value.toLowerCase()
      }
    ],
    initialPageSize: 5
  });

  const columns: TableColumnDefinition<ComplianceDocument>[] = [
    createTableColumn<ComplianceDocument>({
      columnId: 'name',
      renderHeaderCell: () => 'Document',
      renderCell: (d) => d.name
    }),
    createTableColumn<ComplianceDocument>({
      columnId: 'type',
      renderHeaderCell: () => 'Type',
      renderCell: (d) => d.documentType
    }),
    createTableColumn<ComplianceDocument>({
      columnId: 'vehicle',
      renderHeaderCell: () => 'Vehicle',
      renderCell: (d) => d.vehicleRegistration ?? `Vehicle #${d.vehicleId}`
    }),
    createTableColumn<ComplianceDocument>({
      columnId: 'expiry',
      renderHeaderCell: () => 'Expires',
      renderCell: (d) => new Date(d.expiryDate).toLocaleDateString()
    }),
    createTableColumn<ComplianceDocument>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (d) => <StatusBadge value={d.status} />
    })
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
      <Text weight="semibold">Compliance documents ({documents.length})</Text>
      {documents.length === 0 ? (
        <Text style={{ color: tokens.colorNeutralForeground3 }}>No compliance documents for this tenant.</Text>
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder="Search documents…" />
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
    </div>
  );
}

function UserDialog({
  open,
  tenantId,
  roles,
  editTarget,
  onClose,
  onSaved
}: {
  open: boolean;
  tenantId: number;
  roles: Role[];
  editTarget: AdminUser | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = editTarget != null;
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    isActive: true
  });
  const [roleIds, setRoleIds] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (isEdit && editTarget) {
      setLoading(true);
      (async () => {
        try {
          const detail = await getUser(editTarget.id);
          setForm({
            username: detail.username,
            email: detail.email,
            password: '',
            firstName: detail.firstName,
            lastName: detail.lastName,
            isActive: detail.isActive
          });
          setRoleIds(
            roles.filter((r) => detail.roles.includes(r.name)).map((r) => r.id)
          );
        } catch (err) {
          setError(apiErrorMessage(err, 'Unable to load user.'));
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setForm({ username: '', email: '', password: '', firstName: '', lastName: '', isActive: true });
      setRoleIds([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editTarget]);

  const toggleRole = (id: number, checked: boolean) => {
    setRoleIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((x) => x !== id)));
  };

  const submit = async () => {
    setError(null);
    setSaving(true);
    try {
      if (isEdit && editTarget) {
        await updateUser(editTarget.id, {
          id: editTarget.id,
          username: form.username,
          email: form.email,
          firstName: form.firstName,
          lastName: form.lastName,
          isActive: form.isActive,
          roleIds
        });
      } else {
        await createUser({
          username: form.username,
          email: form.email,
          password: form.password,
          firstName: form.firstName,
          lastName: form.lastName,
          isActive: form.isActive,
          tenantId,
          roleIds
        });
      }
      onSaved();
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to save user.'));
    } finally {
      setSaving(false);
    }
  };

  const valid =
    form.username &&
    form.email &&
    form.firstName &&
    form.lastName &&
    (isEdit || form.password) &&
    roleIds.length > 0;

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && onClose()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{isEdit ? 'Edit user' : 'New user'}</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            {loading ? (
              <Spinner label="Loading user…" />
            ) : (
              <>
                <div style={{ display: 'flex', gap: 12 }}>
                  <Field label="First name" required style={{ flex: 1 }}>
                    <Input
                      value={form.firstName}
                      onChange={(_, d) => setForm((f) => ({ ...f, firstName: d.value }))}
                    />
                  </Field>
                  <Field label="Last name" required style={{ flex: 1 }}>
                    <Input
                      value={form.lastName}
                      onChange={(_, d) => setForm((f) => ({ ...f, lastName: d.value }))}
                    />
                  </Field>
                </div>
                <Field label="Username" required>
                  <Input
                    value={form.username}
                    onChange={(_, d) => setForm((f) => ({ ...f, username: d.value }))}
                  />
                </Field>
                <Field label="Email" required>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(_, d) => setForm((f) => ({ ...f, email: d.value }))}
                  />
                </Field>
                {!isEdit && (
                  <Field label="Password" required>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(_, d) => setForm((f) => ({ ...f, password: d.value }))}
                    />
                  </Field>
                )}
                <Field label="Roles" required>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                    {roles.map((r) => (
                      <Switch
                        key={r.id}
                        label={r.name}
                        checked={roleIds.includes(r.id)}
                        onChange={(_, d) => toggleRole(r.id, d.checked)}
                      />
                    ))}
                  </div>
                </Field>
                <Switch
                  label="Active"
                  checked={form.isActive}
                  onChange={(_, d) => setForm((f) => ({ ...f, isActive: d.checked }))}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button appearance="primary" onClick={() => void submit()} disabled={saving || loading || !valid}>
              {saving ? <Spinner size="tiny" /> : isEdit ? 'Save' : 'Create'}
            </Button>
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
