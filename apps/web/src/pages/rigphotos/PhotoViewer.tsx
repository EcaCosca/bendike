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
import { useTranslation } from 'react-i18next';
import type { RigPhotoView } from '@bendike/shared';
import '../../i18n/i18n';
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
  const { t } = useTranslation();
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
      setError(err instanceof Error ? err.message : t('gear.photos.removeFailed'));
      setRemoving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{photo.caption || t('gear.photos.photo')}</DialogTitle>
      <DialogContent>
        <Stack spacing={1.5}>
          {error && <Alert severity="error">{error}</Alert>}
          <Box sx={{ height: { xs: 280, sm: 460 }, bgcolor: 'action.hover', borderRadius: 1, overflow: 'hidden' }}>
            <AuthedImage photoId={photo.id} alt={photo.caption || t('gear.photos.rigPhoto')} fit="contain" />
          </Box>
          <Typography variant="body2" color="text.secondary">
            {t('gear.photos.addedByOn', { name: photo.addedByName, date: photo.createdAt.slice(0, 10) })}
          </Typography>
          {work && <Typography variant="body2">{t('gear.photos.about', { work })}</Typography>}
        </Stack>
      </DialogContent>
      <DialogActions>
        {canRemove && !confirming && (
          <Button color="error" onClick={() => setConfirming(true)}>
            {t('gear.photos.remove')}
          </Button>
        )}
        {confirming && (
          <>
            <Typography variant="body2" sx={{ mr: 1 }}>
              {t('gear.photos.removeHint')}
            </Typography>
            <Button onClick={() => setConfirming(false)}>{t('gear.photos.keep')}</Button>
            <Button color="error" variant="contained" disabled={removing} onClick={() => void remove()}>
              {t('gear.photos.confirmRemove')}
            </Button>
          </>
        )}
        {!confirming && <Button onClick={onClose}>{t('gear.photos.close')}</Button>}
      </DialogActions>
    </Dialog>
  );
}
