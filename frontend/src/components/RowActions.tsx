import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogBody,
  DialogContent,
  DialogSurface,
  DialogTitle,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarBody,
  Spinner
} from '@fluentui/react-components';
import {
  Delete24Regular,
  Eye24Regular,
  MoreHorizontal24Regular
} from '@fluentui/react-icons';
import { apiErrorMessage } from '../api/client';

export interface RowActionsProps {
  onView?: () => void;
  onDelete?: () => Promise<void>;
  deleteLabel?: string;
  deleteConfirm?: string;
}

/**
 * Reusable per-row action menu with optional View navigation and Delete
 * (with confirmation) used across list pages.
 */
export function RowActions({ onView, onDelete, deleteLabel = 'Delete', deleteConfirm }: RowActionsProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const doDelete = async () => {
    if (!onDelete) return;
    setBusy(true);
    setError(null);
    try {
      await onDelete();
      setConfirmOpen(false);
    } catch (err) {
      setError(apiErrorMessage(err, 'Unable to delete item.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Menu>
        <MenuTrigger disableButtonEnhancement>
          <Button
            appearance="subtle"
            size="small"
            icon={<MoreHorizontal24Regular />}
            aria-label="Row actions"
          />
        </MenuTrigger>
        <MenuPopover>
          <MenuList>
            {onView && (
              <MenuItem icon={<Eye24Regular />} onClick={onView}>
                View details
              </MenuItem>
            )}
            {onDelete && (
              <MenuItem icon={<Delete24Regular />} onClick={() => setConfirmOpen(true)}>
                {deleteLabel}
              </MenuItem>
            )}
          </MenuList>
        </MenuPopover>
      </Menu>

      <Dialog open={confirmOpen} onOpenChange={(_, d) => !d.open && setConfirmOpen(false)}>
        <DialogSurface>
          <DialogBody>
            <DialogTitle>Confirm delete</DialogTitle>
            <DialogContent style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {error && (
                <MessageBar intent="error">
                  <MessageBarBody>{error}</MessageBarBody>
                </MessageBar>
              )}
              <span>{deleteConfirm ?? 'Are you sure you want to delete this item? This cannot be undone.'}</span>
            </DialogContent>
            <DialogActions>
              <Button appearance="secondary" onClick={() => setConfirmOpen(false)} disabled={busy}>
                Cancel
              </Button>
              <Button appearance="primary" onClick={() => void doDelete()} disabled={busy}>
                {busy ? <Spinner size="tiny" /> : 'Delete'}
              </Button>
            </DialogActions>
          </DialogBody>
        </DialogSurface>
      </Dialog>
    </>
  );
}
