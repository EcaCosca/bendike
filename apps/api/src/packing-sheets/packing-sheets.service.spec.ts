import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { PACKING_CHECKLIST, PACKING_CHECKLIST_VERSION, Role, type LibraryDocumentView } from '@bendike/shared';
import { GearModel } from '../gear/entities/gear-model.entity';
import { GearItem } from '../gear/entities/gear-item.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { GearAccessService } from '../gear/gear-access.service';
import { GearReadService } from '../gear/gear-read.service';
import { InMemoryManager } from '../gear/testing/in-memory-manager';
import { linkedTo, noRiggers } from '../gear/testing/no-links';
import { User } from '../users/user.entity';
import { buildUser } from '../users/user.factory';
import { PackingSheet } from './packing-sheet.entity';
import { PackingSheetsService } from './packing-sheets.service';

const TODAY = '2026-09-20';

function libraryDoc(overrides: Partial<LibraryDocumentView> = {}): LibraryDocumentView {
  return {
    id: '00000000-0000-4000-8000-0000000000d1',
    title: 'Sigma II Tandem owners manual',
    kind: 'manual',
    manufacturer: 'UPT Vector',
    modelId: null,
    modelName: null,
    revision: 'Rev4',
    language: 'en',
    sourceUrl: null,
    fileName: 'm.pdf',
    sizeBytes: 10,
    addedByName: 'Eca',
    createdAt: '2026-09-20T10:00:00.000Z',
    archivedAt: null,
    archiveReason: null,
    ...overrides,
  };
}

describe('PackingSheetsService: drafts', () => {
  let manager: InMemoryManager;
  let library: { forModel: jest.Mock; view: jest.Mock };
  let sender: { send: jest.Mock };
  const owner = buildUser({
    role: Role.User,
    displayName: 'Ana Skydiver',
    email: 'ana@bendike.example',
    phone: '+5493415550000',
  });
  const rigger = buildUser({ role: Role.Rigger, displayName: 'Eca Rigger' });
  const otherRigger = buildUser({ role: Role.Rigger, displayName: 'Other Rigger' });
  const admin = buildUser({ role: Role.Admin, displayName: 'Admin' });
  const stranger = buildUser({ role: Role.User, displayName: 'Stranger' });
  let rig: Rig;
  let reserve: GearItem;
  let service: PackingSheetsService;

  function build(links = linkedTo([rigger.id, owner.id])) {
    const access = new GearAccessService(links);
    const clock = { today: () => TODAY };
    const read = new GearReadService(manager as never, access, clock, noRiggers);
    return new PackingSheetsService(manager as never, access, read, library as never, clock, sender, {
      webBaseUrl: 'https://app.bendike.example',
    } as never);
  }

  function addItem(kind: GearItem['kind'], values: Partial<GearItem> = {}): GearItem {
    return manager.seed(GearItem, {
      ownerId: owner.id,
      rigId: rig.id,
      modelId: null,
      kind,
      manufacturer: 'UPT Vector',
      model: kind === 'container' ? 'Sigma Tandem' : 'Sigma Reserve',
      serial: `${kind}-serial`,
      manufacturedOn: '2020-01-01',
      notes: '',
      retiredAt: null,
      ...values,
    });
  }

  beforeEach(() => {
    manager = new InMemoryManager();
    library = { forModel: jest.fn().mockResolvedValue([]), view: jest.fn() };
    sender = { send: jest.fn().mockResolvedValue(undefined) };
    manager.seed(User, owner);
    rig = manager.seed(Rig, { ownerId: owner.id, name: 'Tandem 1', notes: '', active: true });
    reserve = addItem('reserve');
    service = build();
  });

  describe('start', () => {
    test('creates a draft prefilled with the owner, the date and the empty checklist', async () => {
      const job = await service.start(rigger, rig.id);

      expect(job.sheet).toMatchObject({
        rigId: rig.id,
        rigName: 'Tandem 1',
        reserveItemId: reserve.id,
        ownerId: owner.id,
        riggerId: rigger.id,
        riggerName: 'Eca Rigger',
        status: 'draft',
        voided: false,
        sheetNo: null,
        performedOn: TODAY,
        checklistVersion: PACKING_CHECKLIST_VERSION,
        checkedIds: [],
        bulletinsChecked: null,
        mardConnected: null,
        ownerName: 'Ana Skydiver',
        ownerEmail: 'ana@bendike.example',
        ownerPhone: '+5493415550000',
        ownerAddress: '',
        manualDocumentId: null,
        notes: '',
        elements: null,
        signedAt: null,
      });
    });

    test('gives back the same draft when the rigger starts again', async () => {
      const first = await service.start(rigger, rig.id);
      const second = await service.start(rigger, rig.id);

      expect(second.sheet.id).toBe(first.sheet.id);
      expect(await manager.find(PackingSheet)).toHaveLength(1);
    });

    test('an admin can start one, and each has their own draft', async () => {
      const mine = await service.start(rigger, rig.id);
      const theirs = await service.start(admin, rig.id);

      expect(theirs.sheet.id).not.toBe(mine.sheet.id);
      expect(theirs.sheet.riggerName).toBe('Admin');
    });

    test('a rig without a reserve is refused', async () => {
      await manager.remove(reserve);

      await expect(service.start(rigger, rig.id)).rejects.toThrow(BadRequestException);
    });

    test.each([
      ['an unknown rig', () => '00000000-0000-4000-8000-00000000ffff', () => rigger],
      ['a rigger with no link to the owner', () => rig.id, () => otherRigger],
      ['the skydiver who owns it', () => rig.id, () => owner],
      ['a stranger', () => rig.id, () => stranger],
    ])('%s gets 404', async (_name, rigId, actor) => {
      await expect(service.start(actor(), rigId())).rejects.toThrow(NotFoundException);
    });
  });

  describe('components of the job', () => {
    test('lists the reserve, container and AAD with their details, and null for a missing one', async () => {
      addItem('container');

      const { components } = await service.start(rigger, rig.id);

      expect(components.reserve).toMatchObject({
        kind: 'reserve',
        itemId: reserve.id,
        manufacturer: 'UPT Vector',
        model: 'Sigma Reserve',
        serial: 'reserve-serial',
        manufacturedOn: '2020-01-01',
      });
      expect(components.container).toMatchObject({ kind: 'container', model: 'Sigma Tandem' });
      expect(components.aad).toBeNull();
    });

    test("offers the catalogue model's own bulletins link, found by the linked model or by name", async () => {
      const link = 'https://uptvector.com/product-service-bulletins/';
      const sigma = manager.seed(GearModel, {
        kind: 'container',
        manufacturer: 'UPT Vector',
        model: 'Sigma Tandem',
        active: true,
        bulletinsUrl: link,
      });
      addItem('container');

      const { components } = await service.start(rigger, rig.id);

      expect(components.container).toMatchObject({ modelId: sigma.id, bulletinsLink: { url: link, source: 'model' } });
      expect(components.reserve).toMatchObject({ modelId: null, bulletinsLink: null });
    });

    test("falls back to another model of the same manufacturer's link", async () => {
      const link = 'https://uptvector.com/product-service-bulletins/';
      manager.seed(GearModel, {
        kind: 'container',
        manufacturer: 'UPT Vector',
        model: 'Vector 3',
        active: true,
        bulletinsUrl: link,
      });
      const reserveModel = manager.seed(GearModel, {
        kind: 'reserve',
        manufacturer: 'UPT Vector',
        model: 'Sigma Reserve',
        active: true,
        bulletinsUrl: null,
      });
      reserve.modelId = reserveModel.id;
      await manager.save(reserve);

      const { components } = await service.start(rigger, rig.id);

      expect(components.reserve?.bulletinsLink).toEqual({ url: link, source: 'manufacturer' });
    });

    test("lists the Library documents of the component's model", async () => {
      const sigmaReserve = manager.seed(GearModel, {
        kind: 'reserve',
        manufacturer: 'UPT Vector',
        model: 'Sigma Reserve',
        active: true,
        bulletinsUrl: null,
      });
      library.forModel.mockImplementation((id: string) =>
        Promise.resolve(id === sigmaReserve.id ? [libraryDoc()] : []),
      );

      const { components } = await service.start(rigger, rig.id);

      expect(components.reserve?.manuals).toEqual([libraryDoc()]);
      expect(library.forModel).toHaveBeenCalledWith(sigmaReserve.id);
    });
  });

  describe('job', () => {
    test('the author and an admin can open a draft; another rigger, even a linked one, cannot', async () => {
      const draft = await service.start(rigger, rig.id);
      const shared = build(linkedTo([rigger.id, owner.id], [otherRigger.id, owner.id]));

      await expect(shared.job(rigger, draft.sheet.id)).resolves.toMatchObject({ sheet: { id: draft.sheet.id } });
      await expect(shared.job(admin, draft.sheet.id)).resolves.toBeDefined();
      await expect(shared.job(otherRigger, draft.sheet.id)).rejects.toThrow(NotFoundException);
      await expect(shared.job(owner, draft.sheet.id)).rejects.toThrow(NotFoundException);
      await expect(service.job(rigger, '00000000-0000-4000-8000-00000000ffff')).rejects.toThrow(NotFoundException);
    });
  });

  describe('saveDraft', () => {
    test('saves the date, ticks, answers, owner details and notes', async () => {
      const { sheet } = await service.start(rigger, rig.id);

      const saved = await service.saveDraft(rigger, sheet.id, {
        performedOn: '2026-09-19',
        checkedIds: ['logbook', 'main_lift_web', 'not-an-item', 'logbook'],
        bulletinsChecked: true,
        mardConnected: false,
        ownerName: ' Ana S. ',
        ownerAddress: 'Calle 1, Rosario',
        ownerPhone: '+54 9 341 555 0000',
        ownerEmail: 'ana@bendike.example',
        notes: 'No MARD on this unit',
      });

      expect(saved.sheet).toMatchObject({
        performedOn: '2026-09-19',
        checkedIds: ['main_lift_web', 'logbook'],
        bulletinsChecked: true,
        mardConnected: false,
        ownerName: 'Ana S.',
        ownerAddress: 'Calle 1, Rosario',
        ownerPhone: '+54 9 341 555 0000',
        notes: 'No MARD on this unit',
      });
      expect((await service.job(rigger, sheet.id)).sheet.checkedIds).toEqual(['main_lift_web', 'logbook']);
    });

    test('a field that is not sent stays as it was', async () => {
      const { sheet } = await service.start(rigger, rig.id);
      await service.saveDraft(rigger, sheet.id, { notes: 'first', bulletinsChecked: true });

      const saved = await service.saveDraft(rigger, sheet.id, { mardConnected: true });

      expect(saved.sheet).toMatchObject({ notes: 'first', bulletinsChecked: true, mardConnected: true });
    });

    test('a badly formed date is refused', async () => {
      const { sheet } = await service.start(rigger, rig.id);

      await expect(service.saveDraft(rigger, sheet.id, { performedOn: '20/09/2026' })).rejects.toThrow(
        BadRequestException,
      );
    });

    test('chooses a Library document and records its title and revision, and clears it again', async () => {
      const { sheet } = await service.start(rigger, rig.id);
      library.view.mockResolvedValue(libraryDoc());

      const chosen = await service.saveDraft(rigger, sheet.id, { manualDocumentId: libraryDoc().id });
      expect(chosen.sheet).toMatchObject({
        manualDocumentId: libraryDoc().id,
        manualLabel: 'Sigma II Tandem owners manual (Rev4)',
      });

      const cleared = await service.saveDraft(rigger, sheet.id, { manualDocumentId: null });
      expect(cleared.sheet).toMatchObject({ manualDocumentId: null, manualLabel: null });
    });

    test('a document that is not in the Library is refused', async () => {
      const { sheet } = await service.start(rigger, rig.id);
      library.view.mockRejectedValue(new NotFoundException('Document not found'));

      await expect(service.saveDraft(rigger, sheet.id, { manualDocumentId: libraryDoc().id })).rejects.toThrow(
        BadRequestException,
      );
    });

    test('another rigger cannot save it, and a signed sheet cannot change', async () => {
      const { sheet } = await service.start(rigger, rig.id);
      const shared = build(linkedTo([rigger.id, owner.id], [otherRigger.id, owner.id]));

      await expect(shared.saveDraft(otherRigger, sheet.id, { notes: 'x' })).rejects.toThrow(NotFoundException);

      const stored = (await manager.findOne(PackingSheet, { where: { id: sheet.id } })) as PackingSheet;
      stored.status = 'signed';
      await manager.save(stored);
      await expect(service.saveDraft(rigger, sheet.id, { notes: 'x' })).rejects.toThrow(ConflictException);
    });
  });

  describe('signing', () => {
    const allIds = PACKING_CHECKLIST.map((item) => item.id);

    async function completeDraft(actor: User = rigger, overrides: Record<string, unknown> = {}) {
      addItem('container');
      addItem('aad', { model: 'Vigil 4', manufacturer: 'Vigil', serial: '28088' });
      const { sheet } = await service.start(actor, rig.id);
      await service.saveDraft(actor, sheet.id, {
        checkedIds: allIds,
        bulletinsChecked: true,
        mardConnected: true,
        ...overrides,
      });
      return sheet.id;
    }

    test('signs a complete sheet: numbers it, snapshots the components and writes the repack entry', async () => {
      const sheetId = await completeDraft(rigger, { performedOn: '2026-09-19' });

      const signed = await service.sign(rigger, sheetId, ' AR-1234 ');

      expect(signed).toMatchObject({
        status: 'signed',
        sheetNo: 1,
        riggerName: 'Eca Rigger',
        riggerLicence: 'AR-1234',
        performedOn: '2026-09-19',
        missing: [],
        voided: false,
        elements: {
          reserve: { kind: 'reserve', manufacturer: 'UPT Vector', model: 'Sigma Reserve', serial: 'reserve-serial' },
          container: { kind: 'container', model: 'Sigma Tandem' },
          aad: { kind: 'aad', manufacturer: 'Vigil', model: 'Vigil 4', serial: '28088' },
        },
      });
      expect(signed.signedAt).not.toBeNull();
      const entries = await manager.find(MaintenanceEntry);
      expect(entries).toHaveLength(1);
      expect(entries[0]).toMatchObject({
        gearItemId: reserve.id,
        kind: 'repack',
        performedOn: '2026-09-19',
        performedById: rigger.id,
        performedByName: 'Eca Rigger',
        performedByLicence: 'AR-1234',
        ownerReported: false,
        voidedAt: null,
      });
      expect(entries[0]?.description).toContain('packing sheet #1');
      expect(signed.entryId).toBe(entries[0]?.id);
    });

    test('numbers sheets per rigger without gaps', async () => {
      const first = await completeDraft();
      await service.sign(rigger, first, 'AR-1');
      const second = (await service.start(rigger, rig.id)).sheet.id;
      await service.saveDraft(rigger, second, { checkedIds: allIds, bulletinsChecked: true, mardConnected: true });
      const adminSheet = (await service.start(admin, rig.id)).sheet.id;
      await service.saveDraft(admin, adminSheet, { checkedIds: allIds, bulletinsChecked: true, mardConnected: true });

      expect((await service.sign(rigger, second, 'AR-1')).sheetNo).toBe(2);
      expect((await service.sign(admin, adminSheet, 'ADM-1')).sheetNo).toBe(1);
    });

    test('anything missing needs notes, and a sheet that is refused stays a draft with no entry', async () => {
      const sheetId = await completeDraft(rigger, {
        checkedIds: allIds.filter((id) => id !== 'mard_hooked'),
        mardConnected: false,
      });

      await expect(service.sign(rigger, sheetId, 'AR-1')).rejects.toThrow(/notes must explain/);

      expect((await service.job(rigger, sheetId)).sheet.status).toBe('draft');
      expect(await manager.find(MaintenanceEntry)).toHaveLength(0);
    });

    test('with notes it signs and keeps what was missing on the sheet', async () => {
      const sheetId = await completeDraft(rigger, {
        checkedIds: allIds.filter((id) => id !== 'mard_hooked'),
        mardConnected: false,
        notes: 'No MARD on this unit',
      });

      const signed = await service.sign(rigger, sheetId, 'AR-1');

      expect(signed.missing).toEqual([
        { code: 'item_unticked', itemId: 'mard_hooked' },
        { code: 'mard_not_connected' },
      ]);
      expect(signed.notes).toBe('No MARD on this unit');
    });

    test('a rig that lacks a container or AAD needs notes too', async () => {
      const { sheet } = await service.start(rigger, rig.id);
      await service.saveDraft(rigger, sheet.id, { checkedIds: allIds, bulletinsChecked: true, mardConnected: true });

      await expect(service.sign(rigger, sheet.id, 'AR-1')).rejects.toThrow(/notes must explain/);
      await service.saveDraft(rigger, sheet.id, { notes: 'Container and AAD are not on this rig' });
      const signed = await service.sign(rigger, sheet.id, 'AR-1');

      expect(signed.missing).toEqual([{ code: 'no_container' }, { code: 'no_aad' }]);
    });

    test.each([
      ['an unanswered bulletins question', { bulletinsChecked: null }, /service bulletins were checked/],
      ['an unanswered MARD question', { mardConnected: null }, /MARD is connected/],
      ['a date in the future', { performedOn: '2026-09-21' }, /future/],
    ])('refuses %s', async (_name, overrides, message) => {
      const sheetId = await completeDraft(rigger, overrides);

      await expect(service.sign(rigger, sheetId, 'AR-1')).rejects.toThrow(message);
      await expect(service.sign(rigger, sheetId, 'AR-1')).rejects.toBeInstanceOf(BadRequestException);
    });

    test('refuses an empty licence number', async () => {
      const sheetId = await completeDraft();

      await expect(service.sign(rigger, sheetId, '   ')).rejects.toThrow(/licence/);
    });

    test('keeps the components as they were even if the gear changes afterwards', async () => {
      const sheetId = await completeDraft();
      await service.sign(rigger, sheetId, 'AR-1');
      const aad = (await manager.find(GearItem, { where: { kind: 'aad' } }))[0] as GearItem;
      aad.model = 'Cypres 2';
      aad.serial = 'new-serial';
      await manager.save(aad);

      const { sheet, components } = await service.job(rigger, sheetId);

      expect(sheet.elements?.aad).toMatchObject({ model: 'Vigil 4', serial: '28088' });
      expect(components).toEqual({ reserve: null, container: null, aad: null });
    });

    test('a signed sheet cannot be signed again, and another rigger gets 404', async () => {
      const sheetId = await completeDraft();
      await service.sign(rigger, sheetId, 'AR-1');
      const shared = build(linkedTo([rigger.id, owner.id], [otherRigger.id, owner.id]));

      await expect(service.sign(rigger, sheetId, 'AR-1')).rejects.toThrow(ConflictException);
      await expect(shared.sign(otherRigger, sheetId, 'AR-2')).rejects.toThrow(NotFoundException);
    });

    test('an authority can read a signed sheet but never a draft', async () => {
      const authority = buildUser({ role: Role.Authority, displayName: 'ANAC' });
      const sheetId = await completeDraft();
      const { sheet: draft } = await service.start(admin, rig.id);
      await service.sign(rigger, sheetId, 'AR-1');

      await expect(service.job(authority, sheetId)).resolves.toMatchObject({ sheet: { status: 'signed' } });
      await expect(service.job(authority, draft.id)).rejects.toThrow(NotFoundException);
    });

    test('the owner and a linked rigger can read a signed sheet, a stranger cannot', async () => {
      const sheetId = await completeDraft();
      await service.sign(rigger, sheetId, 'AR-1');

      await expect(service.job(owner, sheetId)).resolves.toMatchObject({ sheet: { status: 'signed' } });
      await expect(service.job(stranger, sheetId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('list', () => {
    async function signOne(actor: User = rigger, date = TODAY) {
      const { sheet } = await service.start(actor, rig.id);
      await service.saveDraft(actor, sheet.id, {
        performedOn: date,
        checkedIds: PACKING_CHECKLIST.map((item) => item.id),
        bulletinsChecked: true,
        mardConnected: true,
        notes: 'Container and AAD are not on this rig',
      });
      return service.sign(actor, sheet.id, 'AR-1');
    }

    test('lists the signed sheets of a rig or of a reserve, newest first, and not the drafts', async () => {
      const first = await signOne(rigger, '2026-08-01');
      const second = await signOne(rigger, '2026-09-10');
      await service.start(rigger, rig.id);

      const byRig = await service.list(owner, { rigId: rig.id });
      const byReserve = await service.list(owner, { reserveItemId: reserve.id });

      expect(byRig.map((s) => s.sheetNo)).toEqual([second.sheetNo, first.sheetNo]);
      expect(byReserve).toHaveLength(2);
      expect(byRig[0]).toMatchObject({
        rigName: 'Tandem 1',
        riggerName: 'Eca Rigger',
        performedOn: '2026-09-10',
        missingCount: 2,
        voided: false,
      });
    });

    test('a stranger gets 404 and a request with no rig or reserve is refused', async () => {
      await signOne();

      await expect(service.list(stranger, { rigId: rig.id })).rejects.toThrow(NotFoundException);
      await expect(service.list(owner, {})).rejects.toThrow(BadRequestException);
    });
  });

  describe('void', () => {
    async function signed() {
      const { sheet } = await service.start(rigger, rig.id);
      await service.saveDraft(rigger, sheet.id, {
        checkedIds: PACKING_CHECKLIST.map((item) => item.id),
        bulletinsChecked: true,
        mardConnected: true,
        notes: 'Container and AAD are not on this rig',
      });
      return service.sign(rigger, sheet.id, 'AR-1');
    }

    test('voids the sheet and its repack entry, keeping both', async () => {
      const sheet = await signed();

      const voided = await service.voidSheet(rigger, sheet.id, 'Wrong reserve');

      expect(voided).toMatchObject({ voided: true, voidReason: 'Wrong reserve', status: 'signed' });
      const [entry] = await manager.find(MaintenanceEntry);
      expect(entry).toMatchObject({ voidReason: 'Wrong reserve', voidedById: rigger.id });
      expect(entry?.voidedAt).not.toBeNull();
      expect((await service.list(owner, { rigId: rig.id }))[0]?.voided).toBe(true);
    });

    test('needs a reason, cannot be repeated, and only the author or an admin can', async () => {
      const sheet = await signed();
      const shared = build(linkedTo([rigger.id, owner.id], [otherRigger.id, owner.id]));

      await expect(service.voidSheet(rigger, sheet.id, '  ')).rejects.toThrow(BadRequestException);
      await expect(shared.voidSheet(otherRigger, sheet.id, 'Because')).rejects.toThrow(ForbiddenException);
      await expect(service.voidSheet(stranger, sheet.id, 'Because')).rejects.toThrow(NotFoundException);
      await service.voidSheet(admin, sheet.id, 'Admin correction');
      await expect(service.voidSheet(rigger, sheet.id, 'again')).rejects.toThrow(ConflictException);
    });

    test('a draft cannot be voided', async () => {
      const { sheet } = await service.start(rigger, rig.id);

      await expect(service.voidSheet(rigger, sheet.id, 'x')).rejects.toThrow(ConflictException);
    });
  });

  describe('notifying the owner', () => {
    const allIds = PACKING_CHECKLIST.map((item) => item.id);

    async function signedSheet(actor: User = rigger) {
      const { sheet } = await service.start(actor, rig.id);
      await service.saveDraft(actor, sheet.id, {
        checkedIds: allIds,
        bulletinsChecked: true,
        mardConnected: true,
        notes: 'Container and AAD are not on this rig. Completed service bulletin 123xx.',
      });
      return service.sign(actor, sheet.id, 'AR-1234');
    }

    beforeEach(() => {
      manager.seed(User, { ...rigger, phone: '+5493415559999', email: 'eca@bendike.example' });
    });

    test('emails the owner in their language with the rigger, the rig, the next due date and a WhatsApp link', async () => {
      const sheet = await signedSheet();

      const notified = await service.notifyOwner(rigger, sheet.id);

      expect(sender.send).toHaveBeenCalledTimes(1);
      const message = sender.send.mock.calls[0]?.[0] as { to: string; subject: string; text: string; html: string };
      expect(message.to).toBe('ana@bendike.example');
      expect(message.subject).toBe('Tu reserva fue plegada: Tandem 1');
      expect(message.text).toContain('Hola Ana Skydiver');
      expect(message.text).toContain('Eca Rigger');
      expect(message.text).toContain('AR-1234');
      expect(message.text).toContain('19 de marzo de 2027');
      expect(message.text).toContain('Completed service bulletin 123xx');
      expect(message.html).toContain('BENDIKE');
      expect(message.html).toContain('https://wa.me/5493415559999?text=');
      expect(message.html).toContain(`https://app.bendike.example/app/gear/${rig.id}`);
      expect(notified.ownerNotifiedTo).toBe('ana@bendike.example');
      expect(notified.ownerNotifiedAt).not.toBeNull();
    });

    test('sends to the address on the sheet, even when the owner account has another', async () => {
      const { sheet } = await service.start(rigger, rig.id);
      await service.saveDraft(rigger, sheet.id, {
        checkedIds: allIds,
        bulletinsChecked: true,
        mardConnected: true,
        ownerEmail: 'ana.personal@bendike.example',
        notes: 'Container and AAD are not on this rig',
      });
      await service.sign(rigger, sheet.id, 'AR-1234');

      await service.notifyOwner(rigger, sheet.id);

      expect(sender.send).toHaveBeenCalledWith(expect.objectContaining({ to: 'ana.personal@bendike.example' }));
    });

    test('an admin can send it', async () => {
      const sheet = await signedSheet();

      await expect(service.notifyOwner(admin, sheet.id)).resolves.toBeDefined();
    });

    test('refuses a draft, a void sheet, a missing address and a bad address', async () => {
      const { sheet: draft } = await service.start(rigger, rig.id);
      await expect(service.notifyOwner(rigger, draft.id)).rejects.toThrow(ConflictException);

      const signed = await signedSheet();
      const stored = (await manager.findOne(PackingSheet, { where: { id: signed.id } })) as PackingSheet;
      stored.ownerEmail = '';
      await manager.save(stored);
      await expect(service.notifyOwner(rigger, signed.id)).rejects.toThrow(/owner email/);
      stored.ownerEmail = 'not an email';
      await manager.save(stored);
      await expect(service.notifyOwner(rigger, signed.id)).rejects.toThrow(BadRequestException);

      stored.ownerEmail = 'ana@bendike.example';
      await manager.save(stored);
      await service.voidSheet(rigger, signed.id, 'Wrong reserve');
      await expect(service.notifyOwner(rigger, signed.id)).rejects.toThrow(ConflictException);
      expect(sender.send).not.toHaveBeenCalled();
    });

    test('only the rigger who signed it or an admin can send it', async () => {
      const sheet = await signedSheet();
      const shared = build(linkedTo([rigger.id, owner.id], [otherRigger.id, owner.id]));

      await expect(shared.notifyOwner(otherRigger, sheet.id)).rejects.toThrow(ForbiddenException);
      await expect(service.notifyOwner(stranger, sheet.id)).rejects.toThrow(NotFoundException);
      expect(sender.send).not.toHaveBeenCalled();
    });

    test('will not send the same notice twice within ten minutes, but will after that', async () => {
      const sheet = await signedSheet();
      await service.notifyOwner(rigger, sheet.id);

      const again = service.notifyOwner(rigger, sheet.id);
      await expect(again).rejects.toBeInstanceOf(HttpException);
      await expect(again).rejects.toMatchObject({ status: 429 });
      expect(sender.send).toHaveBeenCalledTimes(1);

      const stored = (await manager.findOne(PackingSheet, { where: { id: sheet.id } })) as PackingSheet;
      stored.ownerNotifiedAt = new Date(Date.now() - 11 * 60 * 1000);
      await manager.save(stored);
      await service.notifyOwner(rigger, sheet.id);
      expect(sender.send).toHaveBeenCalledTimes(2);
    });

    test('a provider failure is a 502 and nothing is recorded as sent', async () => {
      const sheet = await signedSheet();
      sender.send.mockRejectedValue(new Error('resend down'));

      await expect(service.notifyOwner(rigger, sheet.id)).rejects.toThrow(BadGatewayException);

      const stored = (await manager.findOne(PackingSheet, { where: { id: sheet.id } })) as PackingSheet;
      expect(stored.ownerNotifiedAt).toBeNull();
      expect(stored.ownerNotifiedTo).toBeNull();
    });
  });
});
