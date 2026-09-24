import 'reflect-metadata';
import { join } from 'node:path';
import { DataSource } from 'typeorm';
import { Brand } from '../catalog/entities/brand.entity';
import { Category } from '../catalog/entities/category.entity';
import { ProductImage } from '../catalog/entities/product-image.entity';
import { ProductVariant } from '../catalog/entities/product-variant.entity';
import { Product } from '../catalog/entities/product.entity';
import { ComponentPart } from '../gear/entities/component-part.entity';
import { AadDetail, ContainerDetail, MainDetail, ReserveDetail } from '../gear/entities/details.entities';
import { GearItem } from '../gear/entities/gear-item.entity';
import { GearModel } from '../gear/entities/gear-model.entity';
import { MaintenanceEntry } from '../gear/entities/maintenance-entry.entity';
import { Rig } from '../gear/entities/rig.entity';
import { ExchangeRate } from '../exchange-rates/exchange-rate.entity';
import { BulletinMatch, BulletinTarget, Grounding, ServiceBulletin } from '../bulletins/entities';
import { RiggerLink } from '../rigger-links/rigger-link.entity';
import { DigestDelivery } from '../reminders/digest-delivery.entity';
import { RiggerSettings } from '../reminders/rigger-settings.entity';
import { LearnCollection, LearnCollectionItem } from '../learn/entities/learn-collection.entity';
import { LearnItemLink } from '../learn/entities/learn-item-link.entity';
import { LearnItem } from '../learn/entities/learn-item.entity';
import { Service } from '../services/entities/service.entity';
import { User } from '../users/user.entity';

export default new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [
    User,
    Brand,
    Category,
    Product,
    ProductVariant,
    ProductImage,
    ExchangeRate,
    Service,
    Rig,
    GearModel,
    GearItem,
    ContainerDetail,
    MainDetail,
    ReserveDetail,
    AadDetail,
    ComponentPart,
    MaintenanceEntry,
    RiggerLink,
    DigestDelivery,
    RiggerSettings,
    ServiceBulletin,
    BulletinTarget,
    BulletinMatch,
    Grounding,
    LearnItem,
    LearnItemLink,
    LearnCollection,
    LearnCollectionItem,
  ],
  migrations: [join(__dirname, 'migrations', '*.ts')],
});
