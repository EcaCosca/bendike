import 'reflect-metadata';
import { Brand } from '../src/catalog/entities/brand.entity';
import { Category } from '../src/catalog/entities/category.entity';
import { ProductImage } from '../src/catalog/entities/product-image.entity';
import { Product } from '../src/catalog/entities/product.entity';
import dataSource from '../src/database/data-source';

interface SeedProduct {
  slug: string;
  name: Product['name'];
  summary: Product['summary'];
  descriptionMd: Product['descriptionMd'];
  listPriceUsd: number;
  sourceUrl: string;
  image: { url: string; alt: string };
}

const FLYSIGHT_2: SeedProduct = {
  slug: 'flysight-2',
  name: { en: 'FlySight 2', es: 'FlySight 2', pt: 'FlySight 2' },
  summary: {
    en: 'GPS and motion-sensor logger for debriefing your jumps.',
    es: 'Registrador GPS y de sensores de movimiento para analizar tus saltos.',
    pt: 'Registrador GPS e de sensores de movimento para analisar os seus saltos.',
  },
  descriptionMd: {
    en: `# FlySight 2

A compact GPS and motion-sensor logger from Bionic Avionics.

- GNSS (u-blox NEO-M9N) with up to 25 Hz measurement rate
- Accelerometer/gyroscope, magnetometer, barometer and humidity/temperature sensors
- 2 GB of storage, with jumps logged to CSV files you can read directly
- About 6 hours of operating time
- 50 × 50 × 17 mm, 44 g without the mount
- Water resistant, IPx7 (submersion up to 1 m for 30 minutes)
- Audio output for headphones

## In the box

- FlySight 2 and mount
- VHB feet for mounting without screws, plus hardware for mounting with screws
- Bottle opener for removing the unit from the mount
- USB-C cable
- Quickstart guide and mount guide

## Software

Debrief your jumps with FlySight Viewer, or import the data into Paralog.`,
    es: `# FlySight 2

Un registrador GPS y de sensores de movimiento compacto de Bionic Avionics.

- GNSS (u-blox NEO-M9N) con frecuencia de medición de hasta 25 Hz
- Acelerómetro/giroscopio, magnetómetro, barómetro y sensores de humedad/temperatura
- 2 GB de almacenamiento; los saltos se registran en archivos CSV que se pueden leer directamente
- Unas 6 horas de funcionamiento
- 50 × 50 × 17 mm, 44 g sin el soporte
- Resistente al agua, IPx7 (sumergible hasta 1 m durante 30 minutos)
- Salida de audio para auriculares

## En la caja

- FlySight 2 y soporte
- Patas VHB para montarlo sin tornillos, más herrajes para montarlo con tornillos
- Destapador para sacar la unidad del soporte
- Cable USB-C
- Guía de inicio rápido y guía de montaje

## Software

Analizá tus saltos con FlySight Viewer, o importá los datos en Paralog.`,
    pt: `# FlySight 2

Um registrador GPS e de sensores de movimento compacto da Bionic Avionics.

- GNSS (u-blox NEO-M9N) com taxa de medição de até 25 Hz
- Acelerômetro/giroscópio, magnetômetro, barômetro e sensores de umidade/temperatura
- 2 GB de armazenamento; os saltos são registrados em arquivos CSV que podem ser lidos diretamente
- Cerca de 6 horas de funcionamento
- 50 × 50 × 17 mm, 44 g sem o suporte
- Resistente à água, IPx7 (submersão de até 1 m por 30 minutos)
- Saída de áudio para fones de ouvido

## Na caixa

- FlySight 2 e suporte
- Pés VHB para montagem sem parafusos, mais ferragens para montagem com parafusos
- Abridor de garrafa para remover a unidade do suporte
- Cabo USB-C
- Guia de início rápido e guia de montagem

## Software

Analise os seus saltos com o FlySight Viewer, ou importe os dados no Paralog.`,
  },
  listPriceUsd: 300,
  sourceUrl: 'https://flysight.ca/features/',
  image: { url: 'https://flysight.ca/wp-content/uploads/2024/01/flysight-2.jpg', alt: 'FlySight 2' },
};

const VIGIL_CUATRO: SeedProduct = {
  slug: 'vigil-cuatro',
  name: { en: 'Vigil Cuatro', es: 'Vigil Cuatro', pt: 'Vigil Cuatro' },
  summary: {
    en: 'Automatic activation device (AAD) with four modes: Pro, Student, Tandem and Xtreme.',
    es: 'Dispositivo de activación automática (AAD) con cuatro modos: Pro, Student, Tandem y Xtreme.',
    pt: 'Dispositivo de ativação automática (AAD) com quatro modos: Pro, Student, Tandem e Xtreme.',
  },
  descriptionMd: {
    en: `# Vigil Cuatro

The Vigil 2+ Cuatro automatic activation device (AAD) from AAD nv/sa, Advanced Aerospace Designs.

- Four modes in one: Pro, Student, Tandem and Xtreme
- Water resistant (IP68, up to 1.8 m for 24 hours)
- No scheduled maintenance; battery replacement between 8 and 12 years
- 20-year service life
- Field replaceable cutter and controller
- Memory of jump numbers, freefall time, number of saves, atmospheric pressure and temperature
- Black box function that keeps the last 16 minutes of freefall

The manufacturer states an activation altitude accuracy of ±60 feet. More at vigil.aero.`,
    es: `# Vigil Cuatro

El dispositivo de activación automática (AAD) Vigil 2+ Cuatro, de AAD nv/sa, Advanced Aerospace Designs.

- Cuatro modos en uno: Pro, Student, Tandem y Xtreme
- Resistente al agua (IP68, hasta 1,8 m durante 24 horas)
- Sin mantenimiento programado; cambio de batería entre los 8 y los 12 años
- 20 años de vida útil
- Cortador y controlador reemplazables en campo
- Memoria de números de salto, tiempo de caída libre, cantidad de salvadas, presión atmosférica y temperatura
- Función de caja negra que conserva los últimos 16 minutos de caída libre

El fabricante declara una precisión de altitud de activación de ±60 pies. Más en vigil.aero.`,
    pt: `# Vigil Cuatro

O dispositivo de ativação automática (AAD) Vigil 2+ Cuatro, da AAD nv/sa, Advanced Aerospace Designs.

- Quatro modos em um: Pro, Student, Tandem e Xtreme
- Resistente à água (IP68, até 1,8 m por 24 horas)
- Sem manutenção programada; troca de bateria entre 8 e 12 anos
- 20 anos de vida útil
- Cortador e controlador substituíveis em campo
- Memória de números de salto, tempo de queda livre, número de salvamentos, pressão atmosférica e temperatura
- Função de caixa-preta que guarda os últimos 16 minutos de queda livre

O fabricante declara uma precisão de altitude de ativação de ±60 pés. Mais em vigil.aero.`,
  },
  listPriceUsd: 1800,
  sourceUrl: 'https://www.vigil.aero/vigil-advantages',
  image: {
    url: 'https://static.wixstatic.com/media/ac507a_a37e2861102d4153a9e95acf66dcaf9f~mv2.jpg',
    alt: 'Vigil Cuatro',
  },
};

async function upsertBrand(name: string, slug: string, websiteUrl: string): Promise<Brand> {
  const brands = dataSource.getRepository(Brand);
  const existing = await brands.findOne({ where: { slug } });
  if (existing) {
    return existing;
  }
  return brands.save(brands.create({ slug, name, websiteUrl, active: true }));
}

async function upsertCategory(slug: string, name: Category['name'], position: number): Promise<Category> {
  const categories = dataSource.getRepository(Category);
  const existing = await categories.findOne({ where: { slug } });
  if (existing) {
    return existing;
  }
  return categories.save(categories.create({ slug, name, parentId: null, position }));
}

async function seedProduct(seed: SeedProduct, brandId: string, categoryId: string): Promise<void> {
  const products = dataSource.getRepository(Product);
  const existing = await products.findOne({ where: { slug: seed.slug } });
  if (existing?.listPriceUsd != null) {
    return;
  }

  const product = await products.save(
    products.create({
      ...existing,
      slug: seed.slug,
      brandId,
      categoryId,
      name: seed.name,
      summary: seed.summary,
      descriptionMd: seed.descriptionMd,
      translationOverrides: {},
      listPriceUsd: String(seed.listPriceUsd),
      markupPercent: '20',
      madeToOrder: false,
      source: 'manual',
      sourceUrl: seed.sourceUrl,
      active: true,
    }),
  );

  const images = dataSource.getRepository(ProductImage);
  if ((await images.count({ where: { productId: product.id } })) === 0) {
    await images.save(images.create({ productId: product.id, url: seed.image.url, alt: seed.image.alt, position: 0 }));
  }
}

async function main(): Promise<void> {
  await dataSource.initialize();

  const vigil = await upsertBrand('Vigil', 'vigil', 'https://www.vigil.aero');
  const flysight = await upsertBrand('FlySight', 'flysight', 'https://flysight.ca');

  const aadCategory = await upsertCategory('aad', { en: 'AADs', es: 'AADs', pt: 'AADs' }, 12);
  const instrumentsCategory = await upsertCategory(
    'instruments',
    { en: 'Instruments', es: 'Instrumentos', pt: 'Instrumentos' },
    13,
  );

  await seedProduct(VIGIL_CUATRO, vigil.id, aadCategory.id);
  await seedProduct(FLYSIGHT_2, flysight.id, instrumentsCategory.id);

  await dataSource.destroy();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
