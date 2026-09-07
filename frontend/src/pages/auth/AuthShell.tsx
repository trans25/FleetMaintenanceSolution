import type { ReactNode } from 'react';
import { makeStyles, shorthands, tokens, Text } from '@fluentui/react-components';
import { VehicleTruck24Filled } from '@fluentui/react-icons';

const useStyles = makeStyles({
  root: { display: 'flex', minHeight: '100vh' },
  brandPane: {
    flexBasis: '42%',
    background: 'linear-gradient(160deg, #0f6cbd 0%, #0a4d8c 100%)',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    ...shorthands.padding('48px'),
    '@media (max-width: 820px)': { display: 'none' }
  },
  brandTitle: { display: 'flex', alignItems: 'center', columnGap: '12px', fontSize: '28px', fontWeight: 600 },
  brandTag: { marginTop: '16px', maxWidth: '360px', opacity: 0.9, lineHeight: 1.5 },
  formPane: {
    flexGrow: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ...shorthands.padding('24px'),
    backgroundColor: tokens.colorNeutralBackground1
  },
  card: { width: '100%', maxWidth: '380px' }
});

export function AuthShell({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <div className={styles.brandPane}>
        <div className={styles.brandTitle}>
          <VehicleTruck24Filled /> Mashia Technology Fleet Platform
        </div>
        <Text className={styles.brandTag} block>
          The all in one platform to manage fleets, track vehicles, report faults and run your workshop, built for teams that keep the wheels turning.
        </Text>
      </div>
      <div className={styles.formPane}>
        <div className={styles.card}>
          <Text size={700} weight="semibold" block>
            {title}
          </Text>
          {subtitle && (
            <Text block style={{ color: tokens.colorNeutralForeground3, marginTop: 4, marginBottom: 20 }}>
              {subtitle}
            </Text>
          )}
          <div style={{ marginTop: subtitle ? 0 : 20 }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
