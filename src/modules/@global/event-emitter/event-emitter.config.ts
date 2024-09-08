import type { EventEmitterModuleOptions } from '@nestjs/event-emitter/dist/interfaces';

export const eventEmitterConfig = (): EventEmitterModuleOptions => ({
  maxListeners: 50,
  verboseMemoryLeak: true,
  ignoreErrors: false,
  delimiter: '.',
  wildcard: false,
  global: true,
  newListener: false,
  removeListener: false,
});
