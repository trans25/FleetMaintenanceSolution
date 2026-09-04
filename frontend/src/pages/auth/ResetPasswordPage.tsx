import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import { AuthShell } from './AuthShell';
import { resetPassword } from '../../services/authService';
import { apiErrorMessage } from '../../api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!token) {
      setError('Missing or invalid reset token.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await resetPassword(token, password);
      navigate('/login', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to reset password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you don't use elsewhere">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        {!token && (
          <MessageBar intent="warning">
            <MessageBarBody>This reset link is missing a token. Request a new one.</MessageBarBody>
          </MessageBar>
        )}
        <Field label="New password" required hint="At least 8 characters.">
          <Input
            type="password"
            value={password}
            onChange={(_, d) => setPassword(d.value)}
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Confirm new password" required>
          <Input
            type="password"
            value={confirm}
            onChange={(_, d) => setConfirm(d.value)}
            autoComplete="new-password"
            required
          />
        </Field>
        <Button type="submit" appearance="primary" disabled={loading}>
          {loading ? <Spinner size="tiny" /> : 'Reset password'}
        </Button>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login">Back to sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}
