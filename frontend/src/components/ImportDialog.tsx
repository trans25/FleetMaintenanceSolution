import { useRef, useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  MessageBar,
  MessageBarBody,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text
} from '@fluentui/react-components';
import type { ImportResult } from '../api/types';
import { apiErrorMessage } from '../api/client';

interface ImportDialogProps {
  open: boolean;
  title: string;
  // Header line describing the expected CSV columns (shown to the user).
  columnsHint: string;
  onImport: (file: File) => Promise<ImportResult>;
  onClose: () => void;
  // Called after a successful import so the caller can refresh its list.
  onImported?: (result: ImportResult) => void;
}

// Reusable CSV upload dialog with a per-row result summary. Used for bulk
// import of fleets and vehicles; the backend stamps TenantId from the caller.
export function ImportDialog({ open, title, columnsHint, onImport, onClose, onImported }: ImportDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  const reset = () => {
    setFile(null);
    setError(null);
    setResult(null);
    setBusy(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  const close = () => {
    reset();
    onClose();
  };

  const submit = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await onImport(file);
      setResult(res);
      onImported?.(res);
    } catch (err) {
      setError(apiErrorMessage(err, 'Import failed. Check the file and try again.'));
    } finally {
      setBusy(false);
    }
  };

  const failedRows = result?.rows.filter((r) => !r.success) ?? [];

  return (
    <Dialog open={open} onOpenChange={(_, d) => !d.open && close()}>
      <DialogSurface>
        <DialogBody>
          <DialogTitle>{title}</DialogTitle>
          <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {error && (
              <MessageBar intent="error">
                <MessageBarBody>{error}</MessageBarBody>
              </MessageBar>
            )}

            {!result && (
              <>
                <Text size={200}>
                  Upload a CSV file. Expected columns: <code>{columnsHint}</code>
                </Text>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
              </>
            )}

            {result && (
              <>
                <MessageBar intent={result.failed > 0 ? 'warning' : 'success'}>
                  <MessageBarBody>
                    Imported {result.imported} of {result.totalRows} rows
                    {result.failed > 0 ? ` — ${result.failed} failed.` : '.'}
                  </MessageBarBody>
                </MessageBar>
                {failedRows.length > 0 && (
                  <Table size="small" aria-label="Failed rows">
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Row</TableHeaderCell>
                        <TableHeaderCell>Identifier</TableHeaderCell>
                        <TableHeaderCell>Error</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failedRows.map((r) => (
                        <TableRow key={r.rowNumber}>
                          <TableCell>{r.rowNumber}</TableCell>
                          <TableCell>{r.identifier ?? '—'}</TableCell>
                          <TableCell>{r.error ?? 'Unknown error'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button appearance="secondary" onClick={close}>
              {result ? 'Close' : 'Cancel'}
            </Button>
            {!result && (
              <Button appearance="primary" onClick={submit} disabled={busy || !file}>
                {busy ? <Spinner size="tiny" /> : 'Import'}
              </Button>
            )}
          </DialogActions>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
