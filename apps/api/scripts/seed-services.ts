import 'reflect-metadata';
import type { LocalizedText, PriceCurrency, ServiceCategory } from '@bendike/shared';
import dataSource from '../src/database/data-source';
import { Service } from '../src/services/entities/service.entity';

interface SeedService {
  slug: string;
  category: ServiceCategory;
  name: LocalizedText;
  summary: LocalizedText;
  descriptionMd: LocalizedText;
  price: { amount: number; currency: PriceCurrency } | null;
}

const SEED_SERVICES: SeedService[] = [
  {
    slug: 'reserve-repack-sport',
    category: 'repack',
    name: {
      en: 'Reserve repack, sport rig',
      es: 'Plegado de reserva, equipo deportivo',
      pt: 'Dobragem de reserva, equipamento esportivo',
    },
    summary: {
      en: 'Inspection and repack of the reserve parachute on a sport rig.',
      es: 'Inspección y plegado del paracaídas de reserva de un equipo deportivo.',
      pt: 'Inspeção e dobragem do paraquedas reserva de um equipamento esportivo.',
    },
    descriptionMd: {
      en: 'The reserve on your sport rig is inspected and repacked, and the packing data card is filled in.',
      es: 'Se inspecciona y se pliega la reserva de tu equipo deportivo, y se completa la tarjeta de datos de plegado.',
      pt: 'A reserva do seu equipamento esportivo é inspecionada e dobrada, e o cartão de dados de dobragem é preenchido.',
    },
    price: { amount: 55000, currency: 'ARS' },
  },
  {
    slug: 'reserve-repack-tandem',
    category: 'repack',
    name: {
      en: 'Reserve repack, tandem rig',
      es: 'Plegado de reserva, equipo tándem',
      pt: 'Dobragem de reserva, equipamento tandem',
    },
    summary: {
      en: 'Inspection and repack of the reserve parachute on a tandem rig.',
      es: 'Inspección y plegado del paracaídas de reserva de un equipo tándem.',
      pt: 'Inspeção e dobragem do paraquedas reserva de um equipamento tandem.',
    },
    descriptionMd: {
      en: 'The reserve on your tandem rig is inspected and repacked, and the packing data card is filled in.',
      es: 'Se inspecciona y se pliega la reserva de tu equipo tándem, y se completa la tarjeta de datos de plegado.',
      pt: 'A reserva do seu equipamento tandem é inspecionada e dobrada, e o cartão de dados de dobragem é preenchido.',
    },
    price: { amount: 90000, currency: 'ARS' },
  },
  {
    slug: 'aad-service',
    category: 'aad_service',
    name: {
      en: 'AAD service: repair, battery exchange or manufacturer service',
      es: 'Servicio de AAD: reparación, cambio de batería o service del fabricante',
      pt: 'Serviço de AAD: reparo, troca de bateria ou revisão do fabricante',
    },
    summary: {
      en: 'Your automatic activation device sent in for repair, a battery exchange or its manufacturer service.',
      es: 'Envío de tu dispositivo de activación automática para reparación, cambio de batería o service del fabricante.',
      pt: 'Envio do seu dispositivo de ativação automática para reparo, troca de bateria ou revisão do fabricante.',
    },
    descriptionMd: {
      en: 'Eca sends your automatic activation device (AAD) in for repair, a battery exchange or the manufacturer service. The price depends on the unit and the job, so ask on WhatsApp.',
      es: 'Eca envía tu dispositivo de activación automática (AAD) para reparación, cambio de batería o service del fabricante. El precio depende del equipo y del trabajo, consultá por WhatsApp.',
      pt: 'O Eca envia o seu dispositivo de ativação automática (AAD) para reparo, troca de bateria ou revisão do fabricante. O preço depende do aparelho e do trabalho, consulte pelo WhatsApp.',
    },
    price: null,
  },
  {
    slug: 'patchwork',
    category: 'repair',
    name: { en: 'Patchwork', es: 'Parches', pt: 'Remendos' },
    summary: {
      en: 'Patchwork repairs to your gear.',
      es: 'Reparaciones con parches para tu equipo.',
      pt: 'Reparos com remendos no seu equipamento.',
    },
    descriptionMd: {
      en: 'Patchwork repairs to your gear. The price depends on the job, so ask on WhatsApp.',
      es: 'Reparaciones con parches para tu equipo. El precio depende del trabajo, consultá por WhatsApp.',
      pt: 'Reparos com remendos no seu equipamento. O preço depende do trabalho, consulte pelo WhatsApp.',
    },
    price: null,
  },
  {
    slug: 'reline',
    category: 'reline',
    name: { en: 'Reline', es: 'Cambio de líneas (reline)', pt: 'Troca de linhas (reline)' },
    summary: {
      en: 'New suspension lines for your canopy.',
      es: 'Líneas de suspensión nuevas para tu velamen.',
      pt: 'Linhas de suspensão novas para o seu velame.',
    },
    descriptionMd: {
      en: 'The suspension lines of your canopy are replaced. Ask on WhatsApp for the price.',
      es: 'Se reemplazan las líneas de suspensión de tu velamen. Consultá el precio por WhatsApp.',
      pt: 'As linhas de suspensão do seu velame são substituídas. Consulte o preço pelo WhatsApp.',
    },
    price: null,
  },
];

async function main(): Promise<void> {
  await dataSource.initialize();
  const services = dataSource.getRepository(Service);

  for (const [position, seed] of SEED_SERVICES.entries()) {
    if (await services.findOne({ where: { slug: seed.slug } })) {
      continue;
    }
    await services.save(
      services.create({
        slug: seed.slug,
        category: seed.category,
        name: seed.name,
        summary: seed.summary,
        descriptionMd: seed.descriptionMd,
        turnaroundNote: null,
        translationOverrides: {},
        priceAmount: seed.price ? String(seed.price.amount) : null,
        priceCurrency: seed.price ? seed.price.currency : null,
        position,
        active: true,
      }),
    );
  }

  await dataSource.destroy();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
