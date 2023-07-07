import { ValidationOptions, registerDecorator, ValidationArguments } from 'class-validator';
import { Constants } from '../common/constants';

export function IsExactBoolean(validationOptions?: ValidationOptions) {
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
}

export function IsEmailCustom(validationOptions?: ValidationOptions) {
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
          return typeof value === 'string' && Constants.EMAIL_REGEX.test(value);
        },
      },
    });
  };
}
