import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import type { RigPhotoView } from '@bendike/shared';
import { AuthedImage } from './AuthedImage';
import { removePhoto } from './rig-photos-api';

interface PhotoViewerProps {
  token: string;
  photo: RigPhotoView;
  work: string | null;
  canRemove: boolean;
  onClose: () => void;
  onRemoved: () => void;
}

export function PhotoViewer({ token, photo, work, canRemove, onClose, onRemoved }: PhotoViewerProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  async function remove() {
    setRemoving(true);
    try {
      await removePhoto(token, photo.id);
      onRemoved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the photo');
      setRemoving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{photo.caption || 'Photo'}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <Box sx={{ height: { xs: 280, sm: 460 }, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
            <AuthedImage photoId={photo.id} alt={photo.caption || 'Rig photo'} fit="contain" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {`Added by ${photo.addedByName} on ${photo.createdAt.slice(0, 10)}`}
          </Typography>
          {work && <Typography variant="body2">{`About: ${work}`}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        {canRemove && !confirming && (
          <Button color="error" onClick={() => setConfirming(true)}>
            Remove photo
          </Button>
        )}
        {confirming && (
          <>
            <Typography variant="body2" sx={{ mr: 1 }}>
              It disappears from the rig; the file is kept.
            </Typography>
            <Button onClick={() => setConfirming(false)}>Keep</Button>
            <Button color="error" variant="contained" disabled={removing} onClick={() => void remove()}>
              Yes, remove it
            </Button>
          </>
        )}
        {!confirming && <Button onClick={onClose}>Close</Button>}
      </DialogActions>
    </Dialog>
  );
}
