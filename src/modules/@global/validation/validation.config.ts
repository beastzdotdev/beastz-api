import { ValidationPipeOptions } from '@nestjs/common';

export const validationConfig = (): ValidationPipeOptions => ({
  forbidNonWhitelisted: true,
  whitelist: true,
  transform: true,
  transformOptions: {
    enableCircularCheck: true,
    enableImplicitConversion: false,
  },
});
