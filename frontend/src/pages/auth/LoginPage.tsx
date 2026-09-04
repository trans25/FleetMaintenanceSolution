import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import { AuthShell } from './AuthShell';
import { useAuth } from '../../auth/AuthContext';
import { apiErrorMessage } from '../../api/client';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: string } };
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(username, password);
      navigate(location.state?.from ?? '/', { replace: true });
    } catch (err) {
      setError(apiErrorMessage(err, 'Invalid username or password.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Sign in" subtitle="Use your Fleet Maintenance account">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        <Field label="Username or email" required>
          <Input
            value={username}
            onChange={(_, d) => setUsername(d.value)}
            autoComplete="username"
            required
          />
        </Field>
        <Field label="Password" required>
          <Input
            type="password"
            value={password}
            onChange={(_, d) => setPassword(d.value)}
            autoComplete="current-password"
            required
          />
        </Field>
        <div style={{ textAlign: 'right' }}>
          <Link to="/forgot-password">Forgot password?</Link>
        </div>
        <Button type="submit" appearance="primary" disabled={loading}>
          {loading ? <Spinner size="tiny" /> : 'Sign in'}
        </Button>
        <div style={{ textAlign: 'center' }}>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </div>
      </form>
    </AuthShell>
  );
}
