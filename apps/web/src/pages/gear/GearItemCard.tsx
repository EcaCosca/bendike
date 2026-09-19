import { Box, Button, Card, CardContent, Chip, IconButton, Link, Stack, Typography } from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import type { ComponentPartView, GearItemView } from '@bendike/shared';
import { Link as RouterLink } from 'react-router-dom';
import { detailLine, identityLine, KIND_LABELS } from './item-details';
import { SEVERITY_COLORS, SEVERITY_LABELS } from '../bulletins/bulletin-labels';
import { DueLine, StatusBadge } from './StatusBadge';

interface GearItemCardProps {
  item: GearItemView;
  canEdit: boolean;
  linkToItem?: boolean;
  canGround?: boolean;
  onGround?: () => void;
  onEdit: () => void;
  onLogWork: () => void;
  onAddPart: () => void;
  onEditPart: (part: ComponentPartView) => void;
  onDeletePart: (part: ComponentPartView) => void;
}

export function GearItemCard({
  item,
  canEdit,
  linkToItem,
  canGround = false,
  onGround,
  onEdit,
  onLogWork,
  onAddPart,
  onEditPart,
  onDeletePart,
}: GearItemCardProps) {
  const label = KIND_LABELS[item.kind];
  const lower = item.kind === 'aad' ? 'AAD' : item.kind;
  const details = detailLine(item);
  return (
    <Card variant="outlined" data-testid={`slot-${item.kind}`}>
      <CardContent>
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
            <Typography variant="overline" color="text.secondary">
              {label}
            </Typography>
            {item.dues.length > 0 && <StatusBadge status={item.status} />}
          </Stack>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            {linkToItem ? (
              <Link component={RouterLink} to={`/app/gear/items/${item.id}`} color="inherit" underline="hover">
                {identityLine(item)}
              </Link>
            ) : (
              identityLine(item)
            )}
          </Typography>
          {details && (
            <Typography variant="body2" color="text.secondary">
              {details}
            </Typography>
          )}
          {item.notes && <Typography variant="body2">{item.notes}</Typography>}
          {item.bulletins.map((notice) => (
            <Stack
              key={notice.matchId}
              direction="row"
              spacing={1}
              alignItems="center"
              sx={{ flexWrap: 'wrap', rowGap: 0.5 }}
            >
              <Chip size="small" color={SEVERITY_COLORS[notice.severity]} label={SEVERITY_LABELS[notice.severity]} />
              <Typography variant="body2">
                {notice.reference}: {notice.title}
              </Typography>
              {notice.confidence === 'needs_review' && (
                <Chip size="small" variant="outlined" color="warning" label="Needs review" />
              )}
            </Stack>
          ))}
          {item.dues.map((due) => (
            <DueLine key={due.kind} due={due} />
          ))}
          {item.parts.length > 0 && (
            <Box component="ul" sx={{ m: 0, pl: 2 }} aria-label={`Parts of ${lower}`}>
              {item.parts.map((part) => (
                <li key={part.id}>
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <Typography variant="body2" sx={{ flexGrow: 1 }}>
                      {part.description}
                      {part.serial ? ` · #${part.serial}` : ''}
                    </Typography>
                    {canEdit && (
                      <>
                        <IconButton
                          size="small"
                          aria-label={`Edit ${part.description}`}
                          onClick={() => onEditPart(part)}
                        >
                          <EditOutlinedIcon fontSize="inherit" />
                        </IconButton>
                        <IconButton
                          size="small"
                          aria-label={`Remove ${part.description}`}
                          onClick={() => onDeletePart(part)}
                        >
                          <DeleteOutlineIcon fontSize="inherit" />
                        </IconButton>
                      </>
                    )}
                  </Stack>
                </li>
              ))}
            </Box>
          )}
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', rowGap: 1 }}>
            <Button size="small" variant="outlined" aria-label={`Log work on ${lower}`} onClick={onLogWork}>
              Log work
            </Button>
            {canGround && (
              <Button size="small" color="error" aria-label={`Ground ${lower}`} onClick={onGround}>
                Ground
              </Button>
            )}
            {canEdit && (
              <>
                <Button size="small" aria-label={`Edit ${lower}`} onClick={onEdit}>
                  Edit
                </Button>
                <Button size="small" aria-label={`Add part to ${lower}`} onClick={onAddPart}>
                  Add part
                </Button>
              </>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
