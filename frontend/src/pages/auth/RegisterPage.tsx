import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import { AuthShell } from './AuthShell';
import { register } from '../../services/authService';
import { apiErrorMessage } from '../../api/client';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantId: '1'
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form) => (_: unknown, d: { value: string }) =>
    setForm((f) => ({ ...f, [key]: d.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        email: form.email,
        password: form.password,
        tenantId: Number(form.tenantId) || 1
      });
      navigate('/login', { replace: true, state: { registered: true } });
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to create account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create account" subtitle="Get started with Fleet Maintenance">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        <div style={{ display: 'flex', gap: 12 }}>
          <Field label="First name" required style={{ flex: 1 }}>
            <Input value={form.firstName} onChange={set('firstName')} required />
          </Field>
          <Field label="Last name" required style={{ flex: 1 }}>
            <Input value={form.lastName} onChange={set('lastName')} required />
          </Field>
        </div>
        <Field label="Username" required>
          <Input value={form.username} onChange={set('username')} autoComplete="username" required />
        </Field>
        <Field label="Email" required>
          <Input type="email" value={form.email} onChange={set('email')} autoComplete="email" required />
        </Field>
        <Field label="Password" required hint="At least 8 characters.">
          <Input
            type="password"
            value={form.password}
            onChange={set('password')}
            autoComplete="new-password"
            required
          />
        </Field>
        <Field label="Confirm password" required>
          <Input
            type="password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            autoComplete="new-password"
            required
          />
        </Field>
        <Button type="submit" appearance="primary" disabled={loading}>
          {loading ? <Spinner size="tiny" /> : 'Create account'}
        </Button>
        <div style={{ textAlign: 'center' }}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </form>
    </AuthShell>
  );
}
