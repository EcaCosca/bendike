import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const ref = await Test.createTestingModule({ controllers: [HealthController] }).compile();
    controller = ref.get(HealthController);
  });

  test('GET /health returns { status: "ok" }', () => {
    expect(controller.check()).toEqual({ status: 'ok' });
  });
});
