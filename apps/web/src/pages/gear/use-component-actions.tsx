import { useState, type ReactNode } from 'react';
import type { ComponentPartView, GearItemView, GearKind, MaintenanceEntryView, RigView, Role } from '@bendike/shared';
import { todayIn } from '@bendike/shared';
import { EntryDialog } from './EntryDialog';
import { deletePart } from './gear-api';
import { GearItemDialog } from './GearItemDialog';
import { PartDialog } from './PartDialog';

type DialogState =
  | { type: 'log'; item: GearItemView }
  | { type: 'edit'; item: GearItemView }
  | { type: 'add'; kind?: GearKind; rigId?: string }
  | { type: 'part'; item: GearItemView; part?: ComponentPartView };

interface Options {
  token: string;
  role: Role;
  ownerId?: string;
  rigs?: RigView[];
  previousEntries: readonly MaintenanceEntryView[];
  onChanged: () => void;
  onError: (message: string) => void;
}

export interface ComponentActions {
  logWork: (item: GearItemView) => void;
  edit: (item: GearItemView) => void;
  addComponent: (kind?: GearKind, rigId?: string) => void;
  addPart: (item: GearItemView) => void;
  editPart: (item: GearItemView, part: ComponentPartView) => void;
  removePart: (part: ComponentPartView) => void;
}

export function useComponentActions({ token, role, ownerId, rigs, previousEntries, onChanged, onError }: Options): {
  actions: ComponentActions;
  dialogs: ReactNode;
} {
  const [state, setState] = useState<DialogState | null>(null);
  const close = () => setState(null);

  const actions: ComponentActions = {
    logWork: (item) => setState({ type: 'log', item }),
    edit: (item) => setState({ type: 'edit', item }),
    addComponent: (kind, rigId) => setState({ type: 'add', ...(kind ? { kind } : {}), ...(rigId ? { rigId } : {}) }),
    addPart: (item) => setState({ type: 'part', item }),
    editPart: (item, part) => setState({ type: 'part', item, part }),
    removePart: (part) => {
      deletePart(token, part.id).then(onChanged, (err: unknown) =>
        onError(err instanceof Error ? err.message : 'Could not remove the part'),
      );
    },
  };

  let dialogs: ReactNode = null;
  if (state?.type === 'log') {
    dialogs = (
      <EntryDialog
        token={token}
        item={state.item}
        role={role}
        today={todayIn(new Date())}
        previousEntries={previousEntries}
        onClose={close}
        onSaved={onChanged}
      />
    );
  } else if (state?.type === 'edit') {
    dialogs = <GearItemDialog token={token} item={state.item} rigs={rigs} onClose={close} onSaved={onChanged} />;
  } else if (state?.type === 'add') {
    dialogs = (
      <GearItemDialog
        token={token}
        {...(state.kind ? { kind: state.kind } : {})}
        {...(state.rigId ? { rigId: state.rigId } : {})}
        {...(ownerId ? { ownerId } : {})}
        rigs={rigs}
        onClose={close}
        onSaved={onChanged}
      />
    );
  } else if (state?.type === 'part') {
    dialogs = (
      <PartDialog
        token={token}
        itemId={state.item.id}
        {...(state.part ? { part: state.part } : {})}
        onClose={close}
        onSaved={onChanged}
      />
    );
  }
  return { actions, dialogs };
}
