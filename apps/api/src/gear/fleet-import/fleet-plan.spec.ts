import { buildFleetPlan, normalizeHeader, type FleetSheets } from './fleet-plan';

const d = (iso: string) => new Date(`${iso}T00:00:00Z`);

function sheets(overrides: Partial<FleetSheets> = {}): FleetSheets {
  return {
    equipos: [
      {
        Nombre: 'Micro A',
        Container: 'UPT Micro Sigma 1001',
        Abridor: 2001,
        Reserva: 'PD VR360 3001',
        Principal: 'Aerodyne A2 350 (Tandem - Rojo)',
        'Inactivo (SI - NO)': null,
      },
      {
        Nombre: 'Escuela B',
        Container: 'Icon Student S6 1002',
        Abridor: 2002,
        Reserva: 'Aerodyne Smart ',
        Principal: 'Aerodyne Solo 190 (Escuela - Naranja)',
        'Inactivo (SI - NO)': null,
      },
      {
        Nombre: 'Viejo C',
        Container: 'Strong DHT 1003',
        Abridor: 2003,
        Reserva: null,
        Principal: null,
        'Inactivo (SI - NO)': 'SI',
      },
    ],
    containers: [
      { Marca: 'UPT', Modelo: 'Micro Sigma', 'Fecha Fabricación': d('2005-04-01'), 'Nro de Serie': 1001 },
      { Marca: 'Icon', Modelo: 'Student S6', 'Fecha Fabricación': '07/12/1017', 'Nro de Serie': 1002 },
      { Marca: 'Strong', Modelo: 'DHT', 'Fecha Fabricación': d('2007-01-01'), 'Nro de Serie': 1003 },
      { Marca: 'UPT', Modelo: 'Micro Sigma', 'Fecha Fabricación': d('2012-05-16'), 'Nro de Serie': 1099 },
    ],
    abridores: [
      {
        Marca: 'AAD',
        Modelo: 'Vigil 4',
        'Fecha Fabricación': d('2021-10-01'),
        'Nro de Serie': 2001,
        'Toca Recorrida': d('2031-10-01'),
        Vencimiento: d('2041-10-01'),
        'Fecha Recorrido': null,
        Obs: null,
      },
      {
        Marca: 'Airtec',
        Modelo: 'Cypres Expert',
        'Fecha Fabricación': d('2025-02-01'),
        'Nro de Serie': 2002,
        'Toca Recorrida': d('2029-02-01'),
        Vencimiento: d('2040-08-01'),
        'Fecha Recorrido': null,
        Obs: null,
      },
      {
        Marca: 'AAD',
        Modelo: 'Vigil 4',
        'Fecha Fabricación': d('2014-10-01'),
        'Nro de Serie': 2003,
        'Toca Recorrida': d('2025-04-01'),
        Vencimiento: d('2034-10-01'),
        'Fecha Recorrido': d('2025-04-01'),
        Obs: 'serviced at the factory',
      },
      {
        Marca: 'Mars',
        Modelo: 'M2',
        'Fecha Fabricación': d('2024-08-01'),
        'Nro de Serie': 2099,
        'Toca Recorrida': null,
        Vencimiento: d('2039-08-01'),
        'Fecha Recorrido': null,
        Obs: null,
      },
    ],
    reservas: [
      {
        Marca: 'PD',
        Modelo: 'VR360',
        'Fecha Fabricación': d('2020-09-01'),
        'Nro de Serie': 3001,
        'Fecha Ultimo Plegado': d('2026-08-27'),
        Obs: null,
      },
      {
        Marca: 'Aerodyne',
        Modelo: 'Smart',
        'Fecha Fabricación': null,
        'Nro de Serie': null,
        'Fecha Ultimo Plegado': d('2026-09-12'),
        Obs: 'serial missing on the card',
      },
      {
        Marca: 'UPT',
        Modelo: 'VTC-2R',
        'Fecha Fabricación': d('2012-02-01'),
        'Nro de Serie': 'VR-360 007284',
        'Fecha Ultimo Plegado': null,
        Obs: null,
      },
    ],
    velamenes: [
      {
        Marca: 'Aerodyne',
        Modelo: 'A2',
        Tamaño: 350,
        Tipo: 'Tandem',
        Color: 'Rojo',
        Serial: 'A2350-X',
        DOM: d('2010-03-14'),
      },
      { Marca: 'Aerodyne', Modelo: 'Solo', Tamaño: 190, Tipo: 'Escuela', Color: 'Naranja', Serial: null, DOM: null },
      {
        Marca: 'PD',
        Modelo: 'Navigator',
        Tamaño: 240,
        Tipo: 'Escuela',
        Color: 'Amarilla/Roja',
        Serial: null,
        DOM: null,
      },
    ],
    ...overrides,
  };
}

describe('normalizeHeader', () => {
  test('ignores case, accents, spaces and punctuation', () => {
    expect(normalizeHeader('Fecha Fabricación')).toBe('fechafabricacion');
    expect(normalizeHeader('Inactivo (SI - NO)')).toBe('inactivosino');
    expect(normalizeHeader('Tamaño')).toBe('tamano');
  });
});

describe('buildFleetPlan', () => {
  test('builds one rig per Equipos row with the components it names', () => {
    const { rigs } = buildFleetPlan(sheets());

    expect(rigs.map((r) => r.name)).toEqual(['Micro A', 'Escuela B', 'Viejo C']);
    const micro = rigs[0];
    expect(micro?.active).toBe(true);
    expect(micro?.items.map((i) => [i.kind, i.manufacturer, i.model, i.serial])).toEqual([
      ['container', 'UPT', 'Micro Sigma', '1001'],
      ['aad', 'Vigil', 'Vigil 4', '2001'],
      ['reserve', 'PD', 'VR360', '3001'],
      ['main', 'Aerodyne', 'A2', 'A2350-X'],
    ]);
  });

  test('a rig marked SI in the inactive column is inactive', () => {
    expect(buildFleetPlan(sheets()).rigs[2]?.active).toBe(false);
  });

  test('components no rig names become spare gear', () => {
    const { spares } = buildFleetPlan(sheets());

    expect(spares.map((i) => [i.kind, i.model, i.serial])).toEqual(
      expect.arrayContaining([
        ['container', 'Micro Sigma', '1099'],
        ['aad', 'M2', '2099'],
        ['reserve', 'VTC-2R', 'VR-360 007284'],
        ['main', 'Navigator', null],
      ]),
    );
    expect(spares).toHaveLength(4);
  });

  test('Vigil AADs typed with the brand AAD get the real manufacturer', () => {
    const aad = buildFleetPlan(sheets()).rigs[0]?.items.find((i) => i.kind === 'aad');

    expect(aad).toMatchObject({ manufacturer: 'Vigil', model: 'Vigil 4' });
  });

  test('an AAD keeps its typed service and expiry dates', () => {
    const aad = buildFleetPlan(sheets()).rigs[0]?.items.find((i) => i.kind === 'aad');

    expect(aad?.details).toMatchObject({ serviceDueOn: '2031-10-01', expiresOn: '2041-10-01' });
    expect(aad?.entries).toEqual([]);
  });

  test('an AAD already serviced becomes a service entry and no longer has a pending service date', () => {
    const serviced = buildFleetPlan(sheets()).spares.find((i) => i.serial === '2003');
    const { rigs } = buildFleetPlan(
      sheets({
        equipos: [
          { Nombre: 'Z', Container: null, Abridor: 2003, Reserva: null, Principal: null, 'Inactivo (SI - NO)': null },
        ],
      }),
    );
    const inRig = rigs[0]?.items[0];

    expect(serviced).toBeUndefined();
    expect(inRig?.details).toMatchObject({ serviceDueOn: null, expiresOn: '2034-10-01' });
    expect(inRig?.entries).toEqual([
      expect.objectContaining({
        kind: 'aad_service',
        performedOn: '2025-04-01',
        description: expect.stringContaining('spreadsheet'),
      }),
    ]);
    expect(inRig?.notes).toBe('serviced at the factory');
  });

  test('a reserve becomes a repack entry at its last fold date', () => {
    const reserve = buildFleetPlan(sheets()).rigs[0]?.items.find((i) => i.kind === 'reserve');

    expect(reserve?.entries).toEqual([expect.objectContaining({ kind: 'repack', performedOn: '2026-08-27' })]);
    expect(reserve?.manufacturedOn).toBe('2020-09-01');
  });

  test('a reserve with no serial links by name ignoring trailing spaces, and has no manufacture date', () => {
    const reserve = buildFleetPlan(sheets()).rigs[1]?.items.find((i) => i.kind === 'reserve');

    expect(reserve).toMatchObject({ manufacturer: 'Aerodyne', model: 'Smart', serial: null, manufacturedOn: null });
    expect(reserve?.notes).toBe('serial missing on the card');
  });

  test('a canopy is a main with its size, type and colour', () => {
    const main = buildFleetPlan(sheets()).rigs[0]?.items.find((i) => i.kind === 'main');

    expect(main?.details).toMatchObject({ sizeSqft: 350 });
    expect(main?.notes).toBe('Tandem, Rojo');
    expect(main?.manufacturedOn).toBe('2010-03-14');
  });

  test('warns about a date that is not a real date and leaves it empty', () => {
    const plan = buildFleetPlan(sheets());
    const container = plan.rigs[1]?.items.find((i) => i.kind === 'container');

    expect(container?.manufacturedOn).toBeNull();
    expect(plan.warnings).toEqual(expect.arrayContaining([expect.stringContaining('07/12/1017')]));
  });

  test('warns when a rig names a component that is not in its sheet', () => {
    const plan = buildFleetPlan(
      sheets({
        equipos: [
          {
            Nombre: 'Z',
            Container: 'UPT Ghost 1',
            Abridor: 999,
            Reserva: 'PD Ghost 2',
            Principal: 'X Y 1 (A - B)',
            'Inactivo (SI - NO)': null,
          },
        ],
      }),
    );

    expect(plan.warnings.filter((w) => w.includes('Z')).length).toBe(4);
    expect(plan.rigs[0]?.items).toEqual([]);
  });

  test('warns when one component is named by two rigs and gives it to the first', () => {
    const plan = buildFleetPlan(
      sheets({
        equipos: [
          {
            Nombre: 'One',
            Container: 'UPT Micro Sigma 1001',
            Abridor: null,
            Reserva: null,
            Principal: null,
            'Inactivo (SI - NO)': null,
          },
          {
            Nombre: 'Two',
            Container: 'UPT Micro Sigma 1001',
            Abridor: null,
            Reserva: null,
            Principal: null,
            'Inactivo (SI - NO)': null,
          },
        ],
      }),
    );

    expect(plan.rigs[0]?.items).toHaveLength(1);
    expect(plan.rigs[1]?.items).toHaveLength(0);
    expect(plan.warnings).toEqual(expect.arrayContaining([expect.stringContaining('already in rig One')]));
  });

  test('skips blank rows', () => {
    const plan = buildFleetPlan(
      sheets({
        containers: [{ Marca: null, Modelo: null, 'Fecha Fabricación': null, 'Nro de Serie': null }],
        equipos: [],
      }),
    );

    expect(plan.rigs).toEqual([]);
    expect(plan.spares.filter((i) => i.kind === 'container')).toEqual([]);
  });
});
