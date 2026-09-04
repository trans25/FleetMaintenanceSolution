import { useState } from 'react';
import {
  Button,
  Card,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner,
  Text,
  tokens
} from '@fluentui/react-components';
import { PageHeader } from '../components/PageHeader';
import { useAuth } from '../auth/AuthContext';
import { changePassword } from '../services/authService';
import { apiErrorMessage } from '../api/client';

export default function AccountPage() {
  const { user } = useAuth();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (next !== confirm) {
      setError('New passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await changePassword(current, next);
      setSuccess(true);
      setCurrent('');
      setNext('');
      setConfirm('');
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to change password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PageHeader title="My account" subtitle="Manage your profile and security settings" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, maxWidth: 900 }}>
        <Card style={{ padding: 24 }}>
          <Text size={500} weight="semibold" block>
            Profile
          </Text>
          <div style={{ marginTop: 16, display: 'grid', rowGap: 10 }}>
            <div>
              <Text style={{ color: tokens.colorNeutralForeground3 }}>Username</Text>
              <Text block weight="semibold">{user?.username}</Text>
            </div>
            <div>
              <Text style={{ color: tokens.colorNeutralForeground3 }}>Email</Text>
              <Text block weight="semibold">{user?.email}</Text>
            </div>
            <div>
              <Text style={{ color: tokens.colorNeutralForeground3 }}>Roles</Text>
              <Text block weight="semibold">{user?.roles?.join(', ') || '—'}</Text>
            </div>
          </div>
        </Card>

        <Card style={{ padding: 24 }}>
          <Text size={500} weight="semibold" block>
            Change password
          </Text>
          <form onSubmit={handleSubmit} style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}
            {success && (
              <MessageBar intent="success">
                <MessageBarBody>Your password has been updated.</MessageBarBody>
              </MessageBar>
            )}
            <Field label="Current password" required>
              <Input type="password" value={current} onChange={(_, d) => setCurrent(d.value)} required />
            </Field>
            <Field label="New password" required hint="At least 8 characters.">
              <Input type="password" value={next} onChange={(_, d) => setNext(d.value)} required />
            </Field>
            <Field label="Confirm new password" required>
              <Input type="password" value={confirm} onChange={(_, d) => setConfirm(d.value)} required />
            </Field>
            <div>
              <Button type="submit" appearance="primary" disabled={loading}>
                {loading ? <Spinner size="tiny" /> : 'Update password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
