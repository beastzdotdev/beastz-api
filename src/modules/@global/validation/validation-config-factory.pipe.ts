import { ValidationPipe, ValueProvider } from '@nestjs/common';
import { validationConfig } from './validation.config';

export class ValidationConfigFactoryPipe {
  static create(): ValueProvider<ValidationPipe>['useValue'] {
    return new ValidationPipe(validationConfig());
  }
}
