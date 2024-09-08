import { Module, DynamicModule, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Global()
@Module({})
export class EventEmitterConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: EventEmitterConfigModule,
      imports: [
        EventEmitterModule.forRoot({
          maxListeners: 50,
          verboseMemoryLeak: true,
          ignoreErrors: false,
          delimiter: '.',
          wildcard: false,
          global: true,
          newListener: false,
          removeListener: false,
        }),
      ],
    };
  }
}
