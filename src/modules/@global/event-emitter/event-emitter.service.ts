import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EmitterEvents } from './event-emitter.type';

@Injectable()
export class EventEmitterService {
  constructor(private eventEmitter: EventEmitter2) {}

  emitAsync<T extends keyof EmitterEvents>(event: T, value: EmitterEvents[T]) {
    return this.eventEmitter.emitAsync(event, value, { test: 123 }, { test: 123 });
  }
}
