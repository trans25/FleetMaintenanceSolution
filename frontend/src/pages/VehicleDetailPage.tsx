import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
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
  makeStyles,
  tokens,
  type TableColumnDefinition
} from '@fluentui/react-components';
import { ArrowLeft24Regular } from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { getVehicle } from '../services/vehicleService';
import { getFaults } from '../services/faultService';
import { getJobCards } from '../services/jobCardService';
import { getSchedulesByVehicle } from '../services/serviceScheduleService';
import { apiErrorMessage } from '../api/client';
import type { Fault, JobCard, ServiceSchedule, Vehicle } from '../api/types';

const useStyles = makeStyles({
  cards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  stat: { padding: '16px' },
  statLabel: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  statValue: { fontSize: '24px', fontWeight: 700 },
  section: { marginTop: '24px' },
  sectionTitle: { fontWeight: 600, fontSize: tokens.fontSizeBase400, marginBottom: '8px' }
});

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function VehicleDetailPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const vehicleId = Number(id);

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [faults, setFaults] = useState<Fault[]>([]);
  const [jobCards, setJobCards] = useState<JobCard[]>([]);
  const [schedules, setSchedules] = useState<ServiceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [v, allFaults, allJobs, sched] = await Promise.all([
          getVehicle(vehicleId),
          getFaults().catch(() => []),
          getJobCards().catch(() => []),
          getSchedulesByVehicle(vehicleId).catch(() => [])
        ]);
        setVehicle(v);
        setFaults(allFaults.filter((f) => f.vehicleId === vehicleId));
        setJobCards(allJobs.filter((j) => j.vehicleId === vehicleId));
        setSchedules(sched);
      } catch (err) {
        setError(apiErrorMessage(err, 'Unable to load vehicle details.'));
      } finally {
        setLoading(false);
      }
    })();
  }, [vehicleId]);

  const totalActualCost = useMemo(
    () => jobCards.reduce((sum, j) => sum + (j.actualCost ?? 0), 0),
    [jobCards]
  );
  const openFaults = useMemo(
    () => faults.filter((f) => (f.status ?? '').toLowerCase() !== 'resolved').length,
    [faults]
  );

  const faultColumns: TableColumnDefinition<Fault>[] = [
    createTableColumn<Fault>({ columnId: 'title', renderHeaderCell: () => 'Title', renderCell: (f) => f.title }),
    createTableColumn<Fault>({ columnId: 'severity', renderHeaderCell: () => 'Severity', renderCell: (f) => <StatusBadge value={f.severity} /> }),
    createTableColumn<Fault>({ columnId: 'reported', renderHeaderCell: () => 'Reported', renderCell: (f) => fmtDate(f.reportedDate) }),
    createTableColumn<Fault>({ columnId: 'status', renderHeaderCell: () => 'Status', renderCell: (f) => <StatusBadge value={f.status} /> })
  ];

  const scheduleColumns: TableColumnDefinition<ServiceSchedule>[] = [
    createTableColumn<ServiceSchedule>({ columnId: 'type', renderHeaderCell: () => 'Service type', renderCell: (s) => s.serviceType }),
    createTableColumn<ServiceSchedule>({ columnId: 'scheduled', renderHeaderCell: () => 'Scheduled', renderCell: (s) => fmtDate(s.scheduledDate) }),
    createTableColumn<ServiceSchedule>({ columnId: 'completed', renderHeaderCell: () => 'Completed', renderCell: (s) => fmtDate(s.completedDate) }),
    createTableColumn<ServiceSchedule>({ columnId: 'status', renderHeaderCell: () => 'Status', renderCell: (s) => <StatusBadge value={s.status} /> })
  ];

  const jobColumns: TableColumnDefinition<JobCard>[] = [
    createTableColumn<JobCard>({ columnId: 'number', renderHeaderCell: () => 'Job #', renderCell: (j) => j.jobNumber }),
    createTableColumn<JobCard>({ columnId: 'title', renderHeaderCell: () => 'Title', renderCell: (j) => j.title }),
    createTableColumn<JobCard>({ columnId: 'cost', renderHeaderCell: () => 'Actual cost', renderCell: (j) => (j.actualCost != null ? `R ${j.actualCost.toLocaleString()}` : '—') }),
    createTableColumn<JobCard>({ columnId: 'status', renderHeaderCell: () => 'Status', renderCell: (j) => <StatusBadge value={j.status} /> })
  ];

  if (loading) return <Spinner label="Loading vehicle…" />;

  if (error || !vehicle) {
    return (
      <>
        <Button icon={<ArrowLeft24Regular />} onClick={() => navigate('/vehicles')} style={{ marginBottom: 16 }}>
          Back to vehicles
        </Button>
        <MessageBar intent="error">
          <MessageBarBody>{error ?? 'Vehicle not found.'}</MessageBarBody>
        </MessageBar>
      </>
    );
  }

  return (
    <>
      <Button icon={<ArrowLeft24Regular />} onClick={() => navigate('/vehicles')} style={{ marginBottom: 16 }}>
        Back to vehicles
      </Button>
      <PageHeader
        title={vehicle.registrationNumber}
        subtitle={`${vehicle.model}${vehicle.year ? ` · ${vehicle.year}` : ''} · VIN ${vehicle.vin}`}
        actions={<StatusBadge value={vehicle.status} />}
      />

      <div className={styles.cards}>
        <Card className={styles.stat}>
          <Text className={styles.statLabel} block>Mileage</Text>
          <Text className={styles.statValue}>{vehicle.mileage?.toLocaleString() ?? '—'}</Text>
        </Card>
        <Card className={styles.stat}>
          <Text className={styles.statLabel} block>Open faults</Text>
          <Text className={styles.statValue}>{openFaults}</Text>
        </Card>
        <Card className={styles.stat}>
          <Text className={styles.statLabel} block>Job cards</Text>
          <Text className={styles.statValue}>{jobCards.length}</Text>
        </Card>
        <Card className={styles.stat}>
          <Text className={styles.statLabel} block>Total maintenance cost</Text>
          <Text className={styles.statValue}>R {totalActualCost.toLocaleString()}</Text>
        </Card>
        <Card className={styles.stat}>
          <Text className={styles.statLabel} block>Last service</Text>
          <Text className={styles.statValue} style={{ fontSize: 18 }}>{fmtDate(vehicle.lastServiceDate)}</Text>
        </Card>
      </div>

      <HistorySection title="Service schedules" items={schedules} columns={scheduleColumns} getId={(s) => s.id} empty="No service schedules for this vehicle." styles={styles} />
      <HistorySection title="Faults" items={faults} columns={faultColumns} getId={(f) => f.id} empty="No faults reported for this vehicle." styles={styles} />
      <HistorySection title="Job cards" items={jobCards} columns={jobColumns} getId={(j) => j.id} empty="No job cards for this vehicle." styles={styles} />
    </>
  );
}

function HistorySection<T>({
  title,
  items,
  columns,
  getId,
  empty,
  styles
}: {
  title: string;
  items: T[];
  columns: TableColumnDefinition<T>[];
  getId: (item: T) => number;
  empty: string;
  styles: ReturnType<typeof useStyles>;
}) {
  return (
    <div className={styles.section}>
      <Text className={styles.sectionTitle}>
        {title} ({items.length})
      </Text>
      {items.length === 0 ? (
        <Text style={{ color: tokens.colorNeutralForeground3 }}>{empty}</Text>
      ) : (
        <DataGrid items={items} columns={columns} getRowId={getId}>
          <DataGridHeader>
            <DataGridRow>
              {({ renderHeaderCell }) => <DataGridHeaderCell>{renderHeaderCell()}</DataGridHeaderCell>}
            </DataGridRow>
          </DataGridHeader>
          <DataGridBody<T>>
            {({ item, rowId }) => (
              <DataGridRow<T> key={rowId}>
                {({ renderCell }) => <DataGridCell>{renderCell(item)}</DataGridCell>}
              </DataGridRow>
            )}
          </DataGridBody>
        </DataGrid>
      )}
    </div>
  );
}
