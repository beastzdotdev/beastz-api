import { ValidationPipe } from '@nestjs/common';

export const globalValidationPipeConfig = new ValidationPipe({
  forbidNonWhitelisted: true,
  transform: true,
  whitelist: true,
});
