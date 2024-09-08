import { Module, DynamicModule, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { eventEmitterConfig } from './event-emitter.config';
import { EventEmitterService } from './event-emitter.service';

@Global()
@Module({
  providers: [EventEmitterService],
  exports: [EventEmitterService],
})
export class EventEmitterConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: EventEmitterConfigModule,
      imports: [EventEmitterModule.forRoot(eventEmitterConfig())],
    };
  }
}
