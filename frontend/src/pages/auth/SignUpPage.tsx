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
import { onboard } from '../../services/authService';
import { apiErrorMessage } from '../../api/client';

// Public self-service onboarding: a prospective client signs up their company
// and becomes its first Tenant Admin. The account stays inactive until the
// work email is verified.
export default function SignUpPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    companyName: '',
    contactPhone: '',
    firstName: '',
    lastName: '',
    username: '',
    workEmail: '',
    password: '',
    confirmPassword: ''
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
      await onboard({
        companyName: form.companyName,
        contactPhone: form.contactPhone || undefined,
        firstName: form.firstName,
        lastName: form.lastName,
        username: form.username,
        workEmail: form.workEmail,
        password: form.password,
        confirmPassword: form.confirmPassword
      });
      navigate('/login', { replace: true, state: { onboarded: true, email: form.workEmail } });
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to create your account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Create your company account" subtitle="Start managing your fleet with Fleet Maintenance">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && (
          <MessageBar intent="error">
            <MessageBarBody>{error}</MessageBarBody>
          </MessageBar>
        )}
        <Field label="Company name" required>
          <Input value={form.companyName} onChange={set('companyName')} required />
        </Field>
        <Field label="Contact phone">
          <Input value={form.contactPhone} onChange={set('contactPhone')} autoComplete="tel" />
        </Field>
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
        <Field label="Work email" required hint="We'll send a verification link to this address.">
          <Input type="email" value={form.workEmail} onChange={set('workEmail')} autoComplete="email" required />
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
