import { registerDecorator } from 'class-validator';
import type { ValidationOptions, ValidationArguments } from 'class-validator';
import { constants } from '../common/constants';

export const IsExactBoolean = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsExactBoolean',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return (
            (typeof value === 'string' || typeof value === 'boolean') && ['true', 'false', true, false].includes(value)
          );
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} must be a boolean value or a string representation of a boolean ("true" or "false").`;
        },
      },
    });
  };
};

export const IsEmailCustom = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsEmailCustom',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: 'Email is invalid',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && constants.EMAIL_REGEX.test(value);
        },
      },
    });
  };
};
