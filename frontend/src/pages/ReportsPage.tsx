import { useEffect, useState } from 'react';
import {
  Card,
  Dropdown,
  Field,
  MessageBar,
  MessageBarBody,
  Option,
  Spinner,
  Text,
  makeStyles,
  tokens
} from '@fluentui/react-components';
import { PageHeader } from '../components/PageHeader';
import { getFleets } from '../services/fleetService';
import { getFleetCostReport } from '../services/reportService';
import { apiErrorMessage } from '../api/client';
import type { Fleet, FleetCostReport } from '../api/types';

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  stat: { padding: '18px' },
  value: { fontSize: '28px', fontWeight: 700 },
  label: { color: tokens.colorNeutralForeground3 }
});

const money = (v: number) => `R ${(v ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

export default function ReportsPage() {
  const styles = useStyles();
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [fleetId, setFleetId] = useState<number | null>(null);
  const [report, setReport] = useState<FleetCostReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const f = await getFleets();
        setFleets(f);
        if (f.length) setFleetId(f[0].id);
      } catch (err) {
        setError(apiErrorMessage(err, 'Unable to load fleets.'));
      }
    })();
  }, []);

  useEffect(() => {
    if (fleetId == null) return;
    setLoading(true);
    setError(null);
    getFleetCostReport(fleetId)
      .then(setReport)
      .catch((err) => setError(apiErrorMessage(err, 'Unable to load report.')))
      .finally(() => setLoading(false));
  }, [fleetId]);

  const selectedName = fleets.find((f) => f.id === fleetId)?.name;

  return (
    <>
      <PageHeader title="Maintenance cost reports" subtitle="Track maintenance spend across your fleet." />

      <Field label="Fleet" style={{ maxWidth: 320, marginBottom: 24 }}>
        <Dropdown
          placeholder="Select a fleet"
          value={selectedName ?? ''}
          selectedOptions={fleetId ? [String(fleetId)] : []}
          onOptionSelect={(_, d) => setFleetId(Number(d.optionValue))}
        >
          {fleets.map((f) => (
            <Option key={f.id} value={String(f.id)}>
              {f.name}
            </Option>
          ))}
        </Dropdown>
      </Field>

      {error && (
        <MessageBar intent="error" style={{ marginBottom: 16 }}>
          <MessageBarBody>{error}</MessageBarBody>
        </MessageBar>
      )}

      {loading ? (
        <Spinner label="Loading report…" />
      ) : report ? (
        <>
          <div className={styles.grid}>
            <Card className={styles.stat}>
              <Text className={styles.label}>Vehicles</Text>
              <Text className={styles.value} block>{report.vehicleCount}</Text>
            </Card>
            <Card className={styles.stat}>
              <Text className={styles.label}>Total job cards</Text>
              <Text className={styles.value} block>{report.totalJobCards}</Text>
            </Card>
            <Card className={styles.stat}>
              <Text className={styles.label}>Open job cards</Text>
              <Text className={styles.value} block>{report.openJobCards}</Text>
            </Card>
            <Card className={styles.stat}>
              <Text className={styles.label}>Completed</Text>
              <Text className={styles.value} block>{report.completedJobCards}</Text>
            </Card>
            <Card className={styles.stat}>
              <Text className={styles.label}>Estimated cost</Text>
              <Text className={styles.value} block>{money(report.totalEstimatedCost)}</Text>
            </Card>
            <Card className={styles.stat}>
              <Text className={styles.label}>Actual cost</Text>
              <Text className={styles.value} block>{money(report.totalActualCost)}</Text>
            </Card>
          </div>

          <Text size={500} weight="semibold" block style={{ marginBottom: 12 }}>
            Per-vehicle breakdown
          </Text>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 640 }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: `1px solid ${tokens.colorNeutralStroke2}` }}>
                  <th style={{ padding: 8 }}>Registration</th>
                  <th style={{ padding: 8 }}>Job cards</th>
                  <th style={{ padding: 8 }}>Open</th>
                  <th style={{ padding: 8 }}>Completed</th>
                  <th style={{ padding: 8 }}>Estimated</th>
                  <th style={{ padding: 8 }}>Actual</th>
                </tr>
              </thead>
              <tbody>
                {report.vehicles?.map((v) => (
                  <tr key={v.vehicleId} style={{ borderBottom: `1px solid ${tokens.colorNeutralStroke3}` }}>
                    <td style={{ padding: 8 }}>{v.registrationNumber}</td>
                    <td style={{ padding: 8 }}>{v.totalJobCards}</td>
                    <td style={{ padding: 8 }}>{v.openJobCards}</td>
                    <td style={{ padding: 8 }}>{v.completedJobCards}</td>
                    <td style={{ padding: 8 }}>{money(v.totalEstimatedCost)}</td>
                    <td style={{ padding: 8 }}>{money(v.totalActualCost)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <Text style={{ color: tokens.colorNeutralForeground3 }}>Select a fleet to view its cost report.</Text>
      )}
    </>
  );
}
