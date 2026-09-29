import { Box, Button, ButtonBase, Paper, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { RIG_PHOTO_MAX_PER_RIG, type MaintenanceEntryView, type RigPhotoView } from '@bendike/shared';
import '../../i18n/i18n';
import { AddPhotoDialog } from './AddPhotoDialog';
import { AuthedImage } from './AuthedImage';
import { PhotoViewer } from './PhotoViewer';
import { workLabel } from './work-labels';

interface RigPhotosProps {
  token: string;
  rigId: string;
  photos: readonly RigPhotoView[];
  entries: readonly MaintenanceEntryView[];
  itemLabels: Record<string, string>;
  canRemove: (photo: RigPhotoView) => boolean;
  onChanged: () => void;
}

export function RigPhotos({ token, rigId, photos, entries, itemLabels, canRemove, onChanged }: RigPhotosProps) {
  const { t } = useTranslation();
  const [adding, setAdding] = useState(false);
  const [viewing, setViewing] = useState<RigPhotoView | null>(null);
  const full = photos.length >= RIG_PHOTO_MAX_PER_RIG;
  const workOf = (photo: RigPhotoView) => {
    const entry = entries.find((e) => e.id === photo.entryId);
    return entry ? workLabel(entry, itemLabels, t) : null;
  };

  return (
    <Paper variant="outlined" component="section" aria-label={t('gear.photos.title')} sx={{ p: 2 }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1 }}>
          <Typography variant="h5" component="h2" sx={{ flexGrow: 1 }}>
            {t('gear.photos.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('gear.photos.count', { n: photos.length, max: RIG_PHOTO_MAX_PER_RIG })}
          </Typography>
          <Button variant="outlined" onClick={() => setAdding(true)} disabled={full}>
            {t('gear.photos.add')}
          </Button>
        </Stack>
        {full && (
          <Typography variant="body2" color="text.secondary">
            {t('gear.photos.full', { max: RIG_PHOTO_MAX_PER_RIG })}
          </Typography>
        )}
        {photos.length === 0 ? (
          <Typography color="text.secondary">{t('gear.photos.empty')}</Typography>
        ) : (
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' } }}>
            {photos.map((photo) => (
              <Box key={photo.id}>
                <ButtonBase
                  aria-label={t('gear.photos.openPhoto', { name: photo.caption || photo.fileName })}
                  onClick={() => setViewing(photo)}
                  sx={{ display: 'block', width: '100%', aspectRatio: '4 / 3', borderRadius: 1, overflow: 'hidden' }}
                >
                  <AuthedImage photoId={photo.id} alt={photo.caption || t('gear.photos.rigPhoto')} />
                </ButtonBase>
                {photo.caption && (
                  <Typography variant="body2" sx={{ mt: 0.5, fontWeight: 600 }}>
                    {photo.caption}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary">
                  {`${photo.addedByName} · ${photo.createdAt.slice(0, 10)}`}
                </Typography>
              </Box>
            ))}
          </Box>
        )}
      </Stack>
      {adding && (
        <AddPhotoDialog
          token={token}
          rigId={rigId}
          entries={entries}
          itemLabels={itemLabels}
          onClose={() => setAdding(false)}
          onSaved={onChanged}
        />
      )}
      {viewing && (
        <PhotoViewer
          token={token}
          photo={viewing}
          work={workOf(viewing)}
          canRemove={canRemove(viewing)}
          onClose={() => setViewing(null)}
          onRemoved={onChanged}
        />
      )}
    </Paper>
  );
}
