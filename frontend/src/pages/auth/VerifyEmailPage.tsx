import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Button,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import { AuthShell } from './AuthShell';
import { verifyEmail, resendVerification } from '../../services/authService';
import { apiErrorMessage } from '../../api/client';

type Status = 'verifying' | 'success' | 'error';

// Consumes the ?token= from the verification email and activates the account.
// If no token is present, offers to resend the verification email.
export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [status, setStatus] = useState<Status>(token ? 'verifying' : 'error');
  const [message, setMessage] = useState<string>(
    token ? '' : 'This verification link is missing its token.'
  );
  const [email, setEmail] = useState('');
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    (async () => {
      try {
        await verifyEmail(token);
        setStatus('success');
        setMessage('Your email has been verified. You can now sign in.');
      } catch (err) {
        setStatus('error');
        setMessage(apiErrorMessage(err, 'Invalid or expired verification link.'));
      }
    })();
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setResendState('sending');
    try {
      await resendVerification(email);
    } finally {
      setResendState('sent');
    }
  };

  return (
    <AuthShell title="Verify your email" subtitle="Confirm your work email to activate your account">
      {status === 'verifying' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Spinner size="tiny" /> Verifying your email…
        </div>
      )}

      {status === 'success' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MessageBar intent="success">
            <MessageBarBody>{message}</MessageBarBody>
          </MessageBar>
          <Link to="/login">Continue to sign in</Link>
        </div>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <MessageBar intent="error">
            <MessageBarBody>{message}</MessageBarBody>
          </MessageBar>
          {resendState === 'sent' ? (
            <MessageBar intent="info">
              <MessageBarBody>
                If that account exists and is unverified, a new verification email has been sent.
              </MessageBarBody>
            </MessageBar>
          ) : (
            <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Field label="Resend verification email">
                <Input
                  type="email"
                  value={email}
                  onChange={(_, d) => setEmail(d.value)}
                  autoComplete="email"
                  placeholder="you@company.com"
                  required
                />
              </Field>
              <Button type="submit" appearance="primary" disabled={resendState === 'sending'}>
                {resendState === 'sending' ? <Spinner size="tiny" /> : 'Resend email'}
              </Button>
            </form>
          )}
          <div style={{ textAlign: 'center' }}>
            <Link to="/login">Back to sign in</Link>
          </div>
        </div>
      )}
    </AuthShell>
  );
}
