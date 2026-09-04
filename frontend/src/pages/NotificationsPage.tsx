import { useEffect, useState } from 'react';
import {
  Button,
  DataGrid,
  DataGridBody,
  DataGridCell,
  DataGridHeader,
  DataGridHeaderCell,
  DataGridRow,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  createTableColumn,
  type TableColumnDefinition
} from '@fluentui/react-components';
import { ArrowClockwise24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { DataToolbar } from '../components/DataToolbar';
import { Pagination } from '../components/Pagination';
import { useListView } from '../hooks/useListView';
import { getNotifications } from '../services/notificationService';
import { apiErrorMessage } from '../api/client';
import type { NotificationItem } from '../api/types';

function fmtDateTime(d?: string): string {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export default function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await getNotifications());
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to load notifications.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const view = useListView<NotificationItem>({
    items,
    searchFields: (n) => [n.subject, n.body, n.recipient, n.type, n.entityType],
    filters: [
      {
        key: 'type',
        label: 'Type',
        options: [
          { value: 'ServiceDue', label: 'Service due' },
          { value: 'CriticalFault', label: 'Critical fault' }
        ],
        predicate: (n, value) => (n.type ?? '').toLowerCase().includes(value.toLowerCase())
      },
      {
        key: 'status',
        label: 'Status',
        options: [
          { value: 'Sent', label: 'Sent' },
          { value: 'Failed', label: 'Failed' },
          { value: 'Skipped', label: 'Skipped' }
        ],
        predicate: (n, value) => (n.status ?? '').toLowerCase() === value.toLowerCase()
      }
    ]
  });

  const columns: TableColumnDefinition<NotificationItem>[] = [
    createTableColumn<NotificationItem>({
      columnId: 'sentAt',
      renderHeaderCell: () => 'Sent',
      renderCell: (n) => fmtDateTime(n.sentAt)
    }),
    createTableColumn<NotificationItem>({
      columnId: 'type',
      renderHeaderCell: () => 'Type',
      renderCell: (n) => n.type
    }),
    createTableColumn<NotificationItem>({
      columnId: 'subject',
      renderHeaderCell: () => 'Subject',
      renderCell: (n) => <Text weight="semibold">{n.subject}</Text>
    }),
    createTableColumn<NotificationItem>({
      columnId: 'recipient',
      renderHeaderCell: () => 'Recipient',
      renderCell: (n) => n.recipient
    }),
    createTableColumn<NotificationItem>({
      columnId: 'status',
      renderHeaderCell: () => 'Status',
      renderCell: (n) => <StatusBadge value={n.status} />
    })
  ];

  return (
    <>
      <PageHeader
        title="Notifications"
        subtitle="Automated alerts for upcoming services and critical faults."
        actions={
          <Button icon={<ArrowClockwise24Regular />} onClick={() => void load()}>
            Refresh
          </Button>
        }
      />
      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}
      {loading ? (
        <Spinner label="Loading notifications…" />
      ) : items.length === 0 ? (
        <MessageBar intent="info">
          <MessageBarBody>No notifications yet. Alerts appear here as the automation runs.</MessageBarBody>
        </MessageBar>
      ) : (
        <>
          <DataToolbar view={view} searchPlaceholder="Search subject, recipient…" />
          <DataGrid items={view.pageItems} columns={columns} getRowId={(n) => n.id} sortable>
            <DataGridHeader>
              <DataGridRow>
                {({ renderHeaderCell }) => (
                  <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>
                )}
              </DataGridRow>
            </DataGridHeader>
            <DataGridBody<NotificationItem>>
              {({ item, rowId }) => (
                <DataGridRow<NotificationItem> key={rowId}>
                  {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
                </DataGridRow>
              )}
            </DataGridBody>
          </DataGrid>
          <Pagination view={view} noun="notifications" />
        </>
      )}
    </>
  );
}
