import type { ValidationOptions } from 'class-validator';
import { ValidateIf } from 'class-validator';

export function IsNullable(validationOptions?: ValidationOptions) {
  return ValidateIf((_object, value) => value !== null, validationOptions);
}
