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
  DocumentBulletList24Regular,
  Building24Regular,
  People24Regular,
  VehicleCar24Regular,
  VehicleTruck24Regular
} from '@fluentui/react-icons';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { useAuth, MANAGER_ROLES, TECHNICIAN_ROLES } from '../auth/AuthContext';
import { getFleets } from '../services/fleetService';
import { getVehicles } from '../services/vehicleService';
import { getFaults } from '../services/faultService';
import { getJobCards } from '../services/jobCardService';
import { getOverdueSchedules, getUpcomingSchedules } from '../services/serviceScheduleService';
import { queryComplianceDocuments } from '../services/complianceService';
import {
  getPlatformSummary,
  getMyWorkSummary,
  getTenantSummary,
  type PlatformDashboardSummary,
  type TechnicianDashboardSummary
} from '../services/dashboardService';
import type { ComplianceDocument, Fault, ServiceSchedule } from '../api/types';

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
  complianceAlerts: number;
}

function fmtDate(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function DashboardPage() {
  const styles = useStyles();
  const navigate = useNavigate();
  const { user, hasAnyRole } = useAuth();

  const isSystemAdmin = hasAnyRole('SystemAdmin');
  // Managers and tenant admins get the full operational dashboard.
  const isManager = !isSystemAdmin && hasAnyRole(...MANAGER_ROLES);
  // Technicians/mechanics get a work-focused view.
  const isTechnician = !isSystemAdmin && !isManager && hasAnyRole(...TECHNICIAN_ROLES);

  if (isSystemAdmin) {
    return <SystemAdminDashboard />;
  }
  if (isTechnician) {
    return <TechnicianDashboard username={user?.username ?? ''} />;
  }
  if (!isManager) {
    return <StaffDashboard username={user?.username ?? ''} />;
  }

  return <ManagerDashboard username={user?.username ?? ''} />;
}

// --- System Admin (platform-wide) dashboard -------------------------------
function SystemAdminDashboard() {
  const styles = useStyles();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<PlatformDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getPlatformSummary();
        if (mounted) setSummary(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tiles = [
    { label: 'Tenants', value: summary?.tenants, icon: <Building24Regular />, to: '/administration' },
    { label: 'Active tenants', value: summary?.activeTenants, icon: <Building24Regular />, to: '/administration' },
    { label: 'Suspended tenants', value: summary?.suspendedTenants, icon: <Alert24Regular />, to: '/administration' },
    { label: 'Fleets', value: summary?.fleets, icon: <VehicleTruck24Regular />, to: '/administration' },
    { label: 'Vehicles', value: summary?.vehicles, icon: <VehicleCar24Regular />, to: '/administration' }
  ];

  return (
    <>
      <PageHeader title="Platform overview" subtitle="Tenants, fleets and vehicles across the platform." />
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
      <Text as="p" style={{ color: tokens.colorNeutralForeground3 }}>
        Manage tenants (create, suspend, activate or delete) from the Administration area.
      </Text>
    </>
  );
}

// --- Technician dashboard --------------------------------------------------
function TechnicianDashboard({ username }: { username: string }) {
  const styles = useStyles();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<TechnicianDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await getMyWorkSummary();
        if (mounted) setSummary(data);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const tiles = [
    { label: 'My job cards', value: summary?.assignedJobCards, icon: <ClipboardTaskListLtr24Regular />, to: '/jobcards' },
    { label: 'Open faults', value: summary?.openFaults, icon: <Alert24Regular />, to: '/faults' }
  ];

  return (
    <>
      <PageHeader title={`Welcome back, ${username}`} subtitle="Your assigned work and open faults." />
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
    </>
  );
}

// --- Staff / Driver dashboard ---------------------------------------------
function StaffDashboard({ username }: { username: string }) {
  const styles = useStyles();
  const navigate = useNavigate();

  const tiles = [
    { label: 'Report a fault', value: '+', icon: <Alert24Regular />, to: '/faults' },
    { label: 'My vehicles', value: '', icon: <VehicleCar24Regular />, to: '/vehicles' }
  ];

  return (
    <>
      <PageHeader title={`Welcome back, ${username}`} subtitle="Report vehicle issues and view your vehicles." />
      <div className={styles.grid}>
        {tiles.map((t) => (
          <Card key={t.label} className={styles.tile} onClick={() => navigate(t.to)}>
            <div className={styles.tileTop}>
              <Text className={styles.label}>{t.label}</Text>
              {t.icon}
            </div>
            {t.value ? (
              <Text className={styles.value} block>
                {t.value}
              </Text>
            ) : null}
          </Card>
        ))}
      </div>
      <Text as="p" style={{ color: tokens.colorNeutralForeground3 }}>
        Spotted a problem with a vehicle? Use “Report a fault” so the workshop can action it.
      </Text>
    </>
  );
}

// --- Manager / Tenant Admin operational dashboard --------------------------
function ManagerDashboard({ username }: { username: string }) {
  const styles = useStyles();
  const navigate = useNavigate();
  const { hasAnyRole } = useAuth();
  const isTenantAdmin = hasAnyRole('TenantAdmin');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<number>(0);
  const [upcoming, setUpcoming] = useState<ServiceSchedule[]>([]);
  const [overdue, setOverdue] = useState<ServiceSchedule[]>([]);
  const [recentFaults, setRecentFaults] = useState<Fault[]>([]);
  const [expiringDocs, setExpiringDocs] = useState<ComplianceDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [fleets, vehicles, faults, jobs, up, over, expired, expiring] = await Promise.all([
          getFleets().catch(() => []),
          getVehicles().catch(() => []),
          getFaults().catch(() => []),
          getJobCards().catch(() => []),
          getUpcomingSchedules().catch(() => []),
          getOverdueSchedules().catch(() => []),
          queryComplianceDocuments({ expiredOnly: true, pageSize: 50 }).catch(() => ({ items: [], totalCount: 0, page: 1, pageSize: 0 })),
          queryComplianceDocuments({ expiringWithinDays: 30, pageSize: 5 }).catch(() => ({ items: [], totalCount: 0, page: 1, pageSize: 0 }))
        ]);
        if (!mounted) return;
        setStats({
          fleets: fleets.length,
          vehicles: vehicles.length,
          openFaults: faults.filter((f) => (f.status ?? '').toLowerCase() !== 'resolved').length,
          activeJobs: jobs.filter((j) =>
            ['open', 'inprogress', 'in progress'].includes((j.status ?? '').toLowerCase())
          ).length,
          complianceAlerts: (expired.totalCount ?? 0) + (expiring.totalCount ?? 0)
        });

        if (isTenantAdmin) {
          const tenantSummary = await getTenantSummary().catch(() => null);
          if (mounted && tenantSummary) setUsers(tenantSummary.users);
        }
        setUpcoming(up.slice(0, 5));
        setOverdue(over.slice(0, 5));
        setExpiringDocs(expiring.items ?? []);
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
  }, [isTenantAdmin]);

  const tiles = [
    { label: 'Fleets', value: stats?.fleets, icon: <VehicleTruck24Regular />, to: '/fleets' },
    { label: 'Vehicles', value: stats?.vehicles, icon: <VehicleCar24Regular />, to: '/vehicles' },
    { label: 'Open faults', value: stats?.openFaults, icon: <Alert24Regular />, to: '/faults' },
    { label: 'Active job cards', value: stats?.activeJobs, icon: <ClipboardTaskListLtr24Regular />, to: '/jobcards' },
    { label: 'Compliance alerts', value: stats?.complianceAlerts, icon: <DocumentBulletList24Regular />, to: '/compliance' },
    ...(isTenantAdmin
      ? [{ label: 'Users', value: users, icon: <People24Regular />, to: '/administration' }]
      : [])
  ];

  return (
    <>
      <PageHeader
        title={`Welcome back, ${username}`}
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
            <Card className={styles.panel}>
              <Text className={styles.panelTitle} block>
                Expiring documents ({expiringDocs.length})
              </Text>
              {expiringDocs.length === 0 ? (
                <Text className={styles.emptyText}>No documents expiring soon.</Text>
              ) : (
                expiringDocs.map((d) => (
                  <div key={d.id} className={styles.row} onClick={() => navigate('/compliance')}>
                    <div>
                      <Text block>{d.name}</Text>
                      <Text className={styles.rowMeta}>
                        {d.vehicleRegistration ?? `Vehicle #${d.vehicleId}`} · expires {fmtDate(d.expiryDate)}
                      </Text>
                    </div>
                    <StatusBadge value={d.status} />
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
