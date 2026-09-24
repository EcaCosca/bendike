import {
  Alert,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { useState, type FormEvent } from 'react';
import type { LearnCollectionSummary, LearnItemAdminDetail, LearnTopic } from '@bendike/shared';
import { LEARN_TOPICS, slugify } from '@bendike/shared';
import { createLearnCollection, updateLearnCollection } from './learn-admin-api';
import { TOPIC_LABELS } from './learn-labels';

interface CollectionDialogProps {
  token: string;
  items: LearnItemAdminDetail[];
  collection?: LearnCollectionSummary;
  onClose: () => void;
  onSaved: (saved: LearnCollectionSummary) => void;
}

function CollectionDialog({ token, items, collection, onClose, onSaved }: CollectionDialogProps) {
  const [title, setTitle] = useState(collection?.title.en ?? '');
  const [intro, setIntro] = useState(collection?.intro.en ?? '');
  const [topic, setTopic] = useState<LearnTopic>(collection?.topic ?? 'aad');
  const [startHere, setStartHere] = useState(collection?.startHere ?? false);
  const [itemIds, setItemIds] = useState<string[]>(collection?.itemIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const saved = collection
        ? await updateLearnCollection(token, collection.id, { topic, startHere, itemIds })
        : await createLearnCollection(token, {
            slug: slugify(title),
            title: title.trim(),
            intro: intro.trim(),
            topic,
            startHere,
            itemIds,
          });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the collection');
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm" component="form" onSubmit={(event) => void submit(event)}>
      <DialogTitle>{collection ? `Edit collection: ${collection.title.en}` : 'Add collection'}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {!collection && (
            <>
              <TextField label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
              <TextField
                label="Intro"
                value={intro}
                onChange={(e) => setIntro(e.target.value)}
                multiline
                minRows={2}
                required
              />
            </>
          )}
          <TextField select label="Topic" value={topic} onChange={(e) => setTopic(e.target.value as LearnTopic)}>
            {LEARN_TOPICS.map((option) => (
              <MenuItem key={option} value={option}>
                {TOPIC_LABELS[option]}
              </MenuItem>
            ))}
          </TextField>
          <FormControlLabel
            control={<Checkbox checked={startHere} onChange={(e) => setStartHere(e.target.checked)} />}
            label="Show first for this topic (start here); one per topic"
          />
          <TextField
            select
            label="Items, in order"
            value={itemIds}
            onChange={(e) => setItemIds(e.target.value as unknown as string[])}
            slotProps={{
              select: {
                multiple: true,
                renderValue: (selected) =>
                  (selected as string[]).map((id) => items.find((item) => item.id === id)?.title.en ?? id).join(', '),
              },
            }}
          >
            {items.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                <Checkbox size="small" checked={itemIds.includes(item.id)} />
                <ListItemText primary={item.title.en} secondary={item.sourceName} />
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={saving}>
          {collection ? 'Save' : 'Add collection'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface LearnCollectionsPanelProps {
  token: string;
  items: LearnItemAdminDetail[];
  collections: LearnCollectionSummary[];
  onChanged: (saved: LearnCollectionSummary) => void;
  onError: (message: string) => void;
}

export function LearnCollectionsPanel({ token, items, collections, onChanged, onError }: LearnCollectionsPanelProps) {
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editing = collections.find((collection) => collection.id === editingId);

  async function toggleActive(collection: LearnCollectionSummary) {
    try {
      onChanged(await updateLearnCollection(token, collection.id, { active: !collection.active }));
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not change the collection');
    }
  }

  return (
    <Stack spacing={2} component="section" aria-labelledby="learn-collections-title">
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography id="learn-collections-title" variant="h5" component="h2">
          Collections
        </Typography>
        <Button variant="outlined" onClick={() => setCreating(true)}>
          Add collection
        </Button>
      </Stack>
      <TableContainer component={Paper} variant="outlined">
        <Table size="small" aria-label="Collections">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Topic</TableCell>
              <TableCell>Start here</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Active</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {collections.map((collection) => (
              <TableRow key={collection.id}>
                <TableCell>{collection.title.en}</TableCell>
                <TableCell>{TOPIC_LABELS[collection.topic]}</TableCell>
                <TableCell>{collection.startHere ? 'Yes' : ''}</TableCell>
                <TableCell>{collection.itemIds.length}</TableCell>
                <TableCell>
                  <Switch
                    checked={collection.active}
                    onChange={() => void toggleActive(collection)}
                    slotProps={{ input: { 'aria-label': `Active: ${collection.title.en}` } }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    size="small"
                    onClick={() => setEditingId(collection.id)}
                    aria-label={`Edit ${collection.title.en}`}
                  >
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {creating && (
        <CollectionDialog token={token} items={items} onClose={() => setCreating(false)} onSaved={onChanged} />
      )}
      {editing && (
        <CollectionDialog
          token={token}
          items={items}
          collection={editing}
          onClose={() => setEditingId(null)}
          onSaved={onChanged}
        />
      )}
    </Stack>
  );
}
