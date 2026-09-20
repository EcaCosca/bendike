import { randomUUID } from 'node:crypto';
import { FindOperator } from 'typeorm';

type EntityClass<T = object> = abstract new () => T;
type Row = Record<string, unknown>;

interface FindOptions {
  where?: Row | Row[];
  order?: Record<string, 'ASC' | 'DESC'>;
}

const TIMESTAMPED = new Set([
  'Rig',
  'GearItem',
  'MaintenanceEntry',
  'RiggerLink',
  'User',
  'ServiceBulletin',
  'LibraryDocument',
  'PackingSheet',
  'RigPhoto',
]);
let tick = 0;

function nextTimestamp(): Date {
  tick += 1;
  return new Date(Date.now() + tick);
}
function keyOf(entityClass: EntityClass): string {
  if (entityClass.name === 'RiggerSettings') return 'riggerId';
  return entityClass.name.endsWith('Detail') ? 'gearItemId' : 'id';
}

function matchValue(actual: unknown, expected: unknown): boolean {
  if (expected instanceof FindOperator) {
    const operator = expected as FindOperator<unknown>;
    switch (operator.type) {
      case 'in':
        return (operator.value as unknown[]).includes(actual);
      case 'isNull':
        return actual === null || actual === undefined;
      case 'not':
        return !matchValue(actual, operator.child ?? operator.value);
      default:
        throw new Error(`InMemoryManager does not support the ${operator.type} operator`);
    }
  }
  if (expected === null) {
    return actual === null || actual === undefined;
  }
  return actual === expected;
}

function matches(row: Row, where: Row | Row[] | undefined): boolean {
  if (where === undefined) {
    return true;
  }
  const alternatives = Array.isArray(where) ? where : [where];
  return alternatives.some((clause) => Object.entries(clause).every(([key, value]) => matchValue(row[key], value)));
}

function compare(a: unknown, b: unknown): number {
  const left = a instanceof Date ? a.getTime() : (a as number | string);
  const right = b instanceof Date ? b.getTime() : (b as number | string);
  if (left === right) return 0;
  return left < right ? -1 : 1;
}

export class InMemoryManager {
  private readonly stores = new Map<EntityClass, Row[]>();

  private store(entityClass: EntityClass): Row[] {
    let rows = this.stores.get(entityClass);
    if (!rows) {
      rows = [];
      this.stores.set(entityClass, rows);
    }
    return rows;
  }

  private clone<T extends object>(entityClass: EntityClass<T>, row: Row): T {
    const instance = Object.create(entityClass.prototype as object) as T;
    return Object.assign(instance, row);
  }

  seed<T extends object>(entityClass: EntityClass<T>, values: Partial<T>): T {
    return this.saveInstance(entityClass, Object.assign(Object.create(entityClass.prototype as object) as T, values));
  }

  create<T extends object>(entityClass: new () => T, values: Partial<T>): T {
    return Object.assign(new entityClass(), values);
  }

  find<T extends object>(entityClass: EntityClass<T>, options: FindOptions = {}): Promise<T[]> {
    let rows = this.store(entityClass).filter((row) => matches(row, options.where));
    const order = Object.entries(options.order ?? {});
    if (order.length > 0) {
      rows = [...rows].sort((a, b) => {
        for (const [key, direction] of order) {
          const result = compare(a[key], b[key]);
          if (result !== 0) return direction === 'DESC' ? -result : result;
        }
        return 0;
      });
    }
    return Promise.resolve(rows.map((row) => this.clone(entityClass, row)));
  }

  async findOne<T extends object>(entityClass: EntityClass<T>, options: FindOptions = {}): Promise<T | null> {
    const [first] = await this.find(entityClass, options);
    return first ?? null;
  }

  async count<T extends object>(entityClass: EntityClass<T>, options: FindOptions = {}): Promise<number> {
    return (await this.find(entityClass, options)).length;
  }

  save<T extends object>(entity: T): Promise<T> {
    return Promise.resolve(this.saveInstance(entity.constructor as EntityClass<T>, entity));
  }

  private saveInstance<T extends object>(entityClass: EntityClass<T>, entity: T): T {
    const row = entity as unknown as Row;
    const key = keyOf(entityClass);
    if (key === 'id' && row.id === undefined) {
      row.id = randomUUID();
    }
    if (TIMESTAMPED.has(entityClass.name)) {
      row.createdAt ??= nextTimestamp();
      if ('updatedAt' in row || entityClass.name !== 'MaintenanceEntry') {
        row.updatedAt = new Date();
      }
    }
    const rows = this.store(entityClass);
    const index = rows.findIndex((existing) => existing[key] === row[key]);
    const stored = { ...row };
    if (index >= 0) {
      rows[index] = stored;
    } else {
      rows.push(stored);
    }
    return entity;
  }

  remove<T extends object>(entity: T): Promise<T> {
    const entityClass = entity.constructor as EntityClass<T>;
    const row = entity as unknown as Row;
    const key = keyOf(entityClass);
    const rows = this.store(entityClass);
    const index = rows.findIndex((existing) => existing[key] === row[key]);
    if (index >= 0) {
      rows.splice(index, 1);
    }
    return Promise.resolve(entity);
  }

  transaction<R>(work: (manager: this) => Promise<R>): Promise<R> {
    return work(this);
  }
}
