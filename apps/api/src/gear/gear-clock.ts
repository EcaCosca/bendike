import { Injectable } from '@nestjs/common';
import { todayIn } from '@bendike/shared';

export abstract class GearClock {
  abstract today(): string;
}

@Injectable()
export class SystemGearClock extends GearClock {
  today(): string {
    return todayIn(new Date());
  }
}
