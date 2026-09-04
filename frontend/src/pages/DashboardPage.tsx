import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Spinner,
  Text,
  makeStyles,
  shorthands,
  tokens
} from '@fluentui/react-components';
import {
  Alert24Regular,
  ClipboardTaskListLtr24Regular,
  VehicleCar24Regular,
  VehicleTruck24Regular
} from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth } from '../auth/AuthContext';
import { getFleets } from '../services/fleetService';
import { getVehicles } from '../services/vehicleService';
import { getFaults } from '../services/faultService';
import { getJobCards } from '../services/jobCardService';
import { getOverdueSchedules, getUpcomingSchedules } from '../services/serviceScheduleService';
import type { Fault, ServiceSchedule } from '../api/types';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
    gap: '16px',
    marginBottom: '28px'
  },
  tile: {
    ...shorthands.padding('20px'),
    cursor: 'pointer',
    ':hover': { boxShadow: tokens.shadow8 }
  },
  tileTop: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  value: { fontSize: '34px', fontWeight: 700 },
  label: { color: tokens.colorNeutralForeground3 },
  panels: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  panel: { ...shorthands.padding('20px') },
  panelTitle: { fontWeight: 600, fontSize: tokens.fontSizeBase400, marginBottom: '12px' },
  row: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shorthands.padding('8px', '0'),
    ...shorthands.borderBottom('1px', 'solid', tokens.colorNeutralStroke2),
    cursor: 'pointer'
  },
  rowMeta: { color: tokens.colorNeutralForeground3, fontSize: tokens.fontSizeBase200 },
  emptyText: { color: tokens.colorNeutralForeground3 }
});

interface Stats {
  fleets: number;
  vehicles: number;
  openFaults: number;
  activeJobs: number;
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function DashboardPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [upcoming, setUpcoming] = useState<ServiceSchedule[]>([]);
  const [overdue, setOverdue] = useState<ServiceSchedule[]>([]);
  const [recentFaults, setRecentFaults] = useState<Fault[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [fleets, vehicles, faults, jobs, up, over] = await Promise.all([
          getFleets().catch(() => []),
          getVehicles().catch(() => []),
          getFaults().catch(() => []),
          getJobCards().catch(() => []),
          getUpcomingSchedules().catch(() => []),
          getOverdueSchedules().catch(() => [])
        ]);
        if (!mounted) return;
        setStats({
          fleets: fleets.length,
          vehicles: vehicles.length,
          openFaults: faults.filter((f) => (f.status ?? '').toLowerCase() !== 'resolved').length,
          activeJobs: jobs.filter((j) =>
            ['open', 'inprogress', 'in progress'].includes((j.status ?? '').toLowerCase())
          ).length
        });
        setUpcoming(up.slice(0, 5));
        setOverdue(over.slice(0, 5));
        setRecentFaults(
          [...faults]
            .sort(
              (a, b) =>
                new Date(b.reportedDate ?? 0).getTime() - new Date(a.reportedDate ?? 0).getTime()
            )
            .slice(0, 5)
        );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tiles = [
    { label: 'Fleets', value: stats?.fleets, icon: <VehicleTruck24Regular />, to: '/fleets' },
    { label: 'Vehicles', value: stats?.vehicles, icon: <VehicleCar24Regular />, to: '/vehicles' },
    { label: 'Open faults', value: stats?.openFaults, icon: <Alert24Regular />, to: '/faults' },
    { label: 'Active job cards', value: stats?.activeJobs, icon: <ClipboardTaskListLtr24Regular />, to: '/jobcards' }
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.username ?? ''}`}
        subtitle="Here's what's happening across your fleet operations."
      />
      {loading ? (
        <Spinner label="Loading dashboard…" />
      ) : (
        <div className={styles.grid}>
          {tiles.map((t) => (
            <Card key={t.label} className={styles.tile} onClick={() => navigate(t.to)}>
              <div className={styles.tileTop}>
                <Text className={styles.label}>{t.label}</Text>
                {t.icon}
              </div>
              <Text className={styles.value} block>
                {t.value ?? 0}
              </Text>
            </Card>
          ))}
        </div>
      )}
      {!loading && (
        <div className={styles.panels}>
          <Card className={styles.panel}>
            <Text className={styles.panelTitle} block>
              Overdue services ({overdue.length})
            </Text>
            {overdue.length === 0 ? (
              <Text className={styles.emptyText}>No overdue services. 🎉</Text>
            ) : (
              overdue.map((s) => (
                <div key={s.id} className={styles.row} onClick={() => navigate('/service-schedules')}>
                  <div>
                    <Text block>{s.vehicleRegistration ?? `Vehicle #${s.vehicleId}`}</Text>
                    <Text className={styles.rowMeta}>{s.serviceType}</Text>
                  </div>
                  <Text className={styles.rowMeta}>{fmtDate(s.scheduledDate)}</Text>
                </div>
              ))
            )}
          </Card>

          <Card className={styles.panel}>
            <Text className={styles.panelTitle} block>
              Upcoming services ({upcoming.length})
            </Text>
            {upcoming.length === 0 ? (
              <Text className={styles.emptyText}>No upcoming services scheduled.</Text>
            ) : (
              upcoming.map((s) => (
                <div key={s.id} className={styles.row} onClick={() => navigate('/service-schedules')}>
                  <div>
                    <Text block>{s.vehicleRegistration ?? `Vehicle #${s.vehicleId}`}</Text>
                    <Text className={styles.rowMeta}>{s.serviceType}</Text>
                  </div>
                  <Text className={styles.rowMeta}>{fmtDate(s.scheduledDate)}</Text>
                </div>
              ))
            )}
          </Card>

          <Card className={styles.panel}>
            <Text className={styles.panelTitle} block>
              Recent faults ({recentFaults.length})
            </Text>
            {recentFaults.length === 0 ? (
              <Text className={styles.emptyText}>No faults reported.</Text>
            ) : (
              recentFaults.map((f) => (
                <div key={f.id} className={styles.row} onClick={() => navigate('/faults')}>
                  <div>
                    <Text block>{f.title}</Text>
                    <Text className={styles.rowMeta}>
                      {f.vehicleRegistration ?? `Vehicle #${f.vehicleId}`} · {fmtDate(f.reportedDate)}
                    </Text>
                  </div>
                  <StatusBadge value={f.severity} />
                </div>
              ))
            )}
          </Card>
        </div>
      )}
      <Text as="p" style={{ color: tokens.colorNeutralForeground3 }}>
        Use the navigation on the left to manage fleets and vehicles, report and triage faults, run
        workshop job cards, and review maintenance cost reports.
      </Text>
    </>
  );
}
