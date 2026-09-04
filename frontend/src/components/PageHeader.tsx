import type { ReactNode } from 'react';
import { Text, makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    rowGap: '12px'
  },
  subtitle: { color: tokens.colorNeutralForeground3, marginTop: '4px' }
});

export function PageHeader({
  title,
  subtitle,
  actions
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  const styles = useStyles();
  return (
    <div className={styles.root}>
      <div>
        <Text size={700} weight="semibold" as="h1" block>
          {title}
        </Text>
        {subtitle && (
          <Text className={styles.subtitle} block>
            {subtitle}
          </Text>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
    </div>
  );
}
