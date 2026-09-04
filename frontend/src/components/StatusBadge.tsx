import { Badge } from '@fluentui/react-components';

type Appearance = 'filled' | 'ghost' | 'outline' | 'tint';
type Color = 'brand' | 'danger' | 'important' | 'informative' | 'severe' | 'subtle' | 'success' | 'warning';

const MAP: Record<string, Color> = {
  // generic
  active: 'success',
  inactive: 'subtle',
  open: 'informative',
  inprogress: 'warning',
  'in progress': 'warning',
  completed: 'success',
  resolved: 'success',
  cancelled: 'subtle',
  closed: 'subtle',
  // severity / priority
  low: 'success',
  medium: 'warning',
  high: 'danger',
  critical: 'danger',
  // vehicle
  available: 'success',
  maintenance: 'warning',
  outofservice: 'danger',
  'out of service': 'danger',
  retired: 'subtle'
};

export function StatusBadge({ value, appearance = 'tint' }: { value?: string; appearance?: Appearance }) {
  const key = (value ?? '').toLowerCase().replace(/_/g, ' ');
  const color = MAP[key] ?? 'informative';
  return (
    <Badge appearance={appearance} color={color}>
      {value ?? '—'}
    </Badge>
  );
}
