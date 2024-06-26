import type { ValidationOptions, ValidationArguments } from 'class-validator';
import { registerDecorator } from 'class-validator';
import { constants } from '../common/constants';
import { sanitizeRelativePathForFolder } from '../modules/file-structure/file-structure.helper';

export const IsExactBoolean = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IsExactBoolean.name,
      target: object.constructor,
      propertyName: propertyName.toString(),
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
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IsEmailCustom.name,
      target: object.constructor,
      propertyName: propertyName.toString(),
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

export const IsRelativeDirPath = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IsRelativeDirPath.name,
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [],
      options: {
        message: 'Invalid dir relative path',
        ...validationOptions,
      },
      validator: {
        validate(value: string) {
          return value === sanitizeRelativePathForFolder(value);
        },
      },
    });
  };
};
