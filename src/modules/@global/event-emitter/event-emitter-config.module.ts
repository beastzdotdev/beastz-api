import { Module, DynamicModule, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { eventEmitterConfig } from './event-emitter.config';

@Global()
@Module({})
export class EventEmitterConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: EventEmitterConfigModule,
      imports: [EventEmitterModule.forRoot(eventEmitterConfig())],
    };
  }
}
