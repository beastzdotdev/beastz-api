import { ValidationPipe } from '@nestjs/common';

export const globalValidationPipeConfig = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
});
