import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectEntityManager } from '@nestjs/typeorm';
import {
  isHttpsUrl,
  type CreateGearModelRequestBody,
  type GearModelView,
  type UpdateGearModelRequestBody,
} from '@bendike/shared';
import type { EntityManager } from 'typeorm';
import { GearModel } from './entities/gear-model.entity';

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function toView(model: GearModel): GearModelView {
  return {
    id: model.id,
    kind: model.kind,
    manufacturer: model.manufacturer,
    model: model.model,
    repackCycleDays: model.repackCycleDays,
    serviceIntervalMonths: model.serviceIntervalMonths,
    batteryCycleMonths: model.batteryCycleMonths,
    lifeYears: model.lifeYears,
    active: model.active,
    bulletinsUrl: model.bulletinsUrl,
  };
}

function validLink(url: string | null | undefined): string | null | undefined {
  if (url === null || url === undefined) return url;
  const trimmed = url.trim();
  if (trimmed === '') return null;
  if (!isHttpsUrl(trimmed)) {
    throw new BadRequestException('The bulletins link must start with https://');
  }
  return trimmed;
}

@Injectable()
export class GearModelsService {
  constructor(@InjectEntityManager() private readonly manager: EntityManager) {}

  async list(includeInactive = false): Promise<GearModelView[]> {
    const models = await this.manager.find(GearModel, includeInactive ? {} : { where: { active: true } });
    return models
      .sort(
        (a, b) =>
          a.manufacturer.localeCompare(b.manufacturer, 'en', { sensitivity: 'base' }) ||
          a.model.localeCompare(b.model, 'en', { sensitivity: 'base' }),
      )
      .map(toView);
  }

  async create(body: CreateGearModelRequestBody): Promise<GearModelView> {
    await this.assertUnique(body.kind, body.manufacturer, body.model);
    const model = this.manager.create(GearModel, {
      kind: body.kind,
      manufacturer: body.manufacturer.trim(),
      model: body.model.trim(),
      repackCycleDays: body.repackCycleDays ?? null,
      serviceIntervalMonths: body.serviceIntervalMonths ?? null,
      batteryCycleMonths: body.batteryCycleMonths ?? null,
      lifeYears: body.lifeYears ?? null,
      active: true,
      bulletinsUrl: validLink(body.bulletinsUrl) ?? null,
    });
    return toView(await this.manager.save(model));
  }

  async update(id: string, body: UpdateGearModelRequestBody): Promise<GearModelView> {
    const model = await this.manager.findOne(GearModel, { where: { id } });
    if (!model) {
      throw new NotFoundException(`Gear model ${id} not found`);
    }
    const manufacturer = body.manufacturer?.trim() ?? model.manufacturer;
    const name = body.model?.trim() ?? model.model;
    if (normalize(manufacturer) !== normalize(model.manufacturer) || normalize(name) !== normalize(model.model)) {
      await this.assertUnique(model.kind, manufacturer, name, model.id);
    }
    model.manufacturer = manufacturer;
    model.model = name;
    for (const key of ['repackCycleDays', 'serviceIntervalMonths', 'batteryCycleMonths', 'lifeYears'] as const) {
      if (body[key] !== undefined) {
        model[key] = body[key] ?? null;
      }
    }
    if (body.active !== undefined) {
      model.active = body.active;
    }
    if (body.bulletinsUrl !== undefined) {
      model.bulletinsUrl = validLink(body.bulletinsUrl) ?? null;
    }
    return toView(await this.manager.save(model));
  }

  setBulletinsUrl(id: string, url: string): Promise<GearModelView> {
    return this.update(id, { bulletinsUrl: url });
  }

  private async assertUnique(
    kind: GearModel['kind'],
    manufacturer: string,
    name: string,
    ignoreId?: string,
  ): Promise<void> {
    const sameKind = await this.manager.find(GearModel, { where: { kind } });
    const clash = sameKind.some(
      (m) =>
        m.id !== ignoreId &&
        normalize(m.manufacturer) === normalize(manufacturer) &&
        normalize(m.model) === normalize(name),
    );
    if (clash) {
      throw new ConflictException(`${manufacturer} ${name} already exists in the catalogue`);
    }
  }
}
