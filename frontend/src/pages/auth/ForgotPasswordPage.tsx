import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import { AuthShell } from './AuthShell';
import { forgotPassword } from '../../services/authService';
import { apiErrorMessage } from '../../api/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to process request.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Reset password" subtitle="We'll email you a reset link">
      {sent ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MessageBar intent="success">
            <MessageBarBody>
              If an account with that email exists, a password reset link has been sent.
            </MessageBarBody>
          </MessageBar>
          <Link to="/login">Back to sign in</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <MessageBar intent="error">
              <MessageBarBody>{error}</MessageBarBody>
            </MessageBar>
          )}
          <Field label="Email" required>
            <Input type="email" value={email} onChange={(_, d) => setEmail(d.value)} required />
          </Field>
          <Button type="submit" appearance="primary" disabled={loading}>
            {loading ? <Spinner size="tiny" /> : 'Send reset link'}
          </Button>
          <div style={{ textAlign: 'center' }}>
            <Link to="/login">Back to sign in</Link>
          </div>
        </form>
      )}
    </AuthShell>
  );
}
