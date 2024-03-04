import sanitize from 'sanitize-html';
import type { ValidationOptions, ValidationArguments } from 'class-validator';
import { registerDecorator } from 'class-validator';
import { constants } from '../common/constants';
import { isMulterFile } from '../common/helper';

export const IsExactBoolean = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: 'IsExactBoolean',
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
      name: 'IsEmailCustom',
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

const IsMulterFileInstance = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IsMulterFileInstance.name,
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [],
      options: {
        message: `${propertyName.toString()} must be file`,
        ...validationOptions,
      },
      validator: {
        validate: (value: unknown) => isMulterFile(value),
      },
    });
  };
};

const IsMulterFileTypes = (fileTypes: string[], validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IsMulterFileTypes.name,
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [],
      options: {
        message: args =>
          `${propertyName.toString()} mimetype is not accepted ${(<Express.Multer.File>args.value)?.mimetype ?? ''}`,
        ...validationOptions,
      },
      validator: {
        validate(value: Express.Multer.File) {
          if (!value) {
            return false;
          }

          if (!fileTypes.length) {
            throw new Error('You forgot to add file types');
          }

          if (fileTypes.length === 1) {
            return !!value.mimetype.match(fileTypes[0]);
          }

          return fileTypes.includes(value.mimetype);
        },
      },
    });
  };
};

const IsMulterFileMaxSize = (maxSize: number, validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IsMulterFileMaxSize.name,
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [],
      options: {
        message: args =>
          `${propertyName.toString()} max size is ${maxSize} bytes, current size ${
            (<Express.Multer.File>args.value)?.size ?? 0
          }`,
        ...validationOptions,
      },
      validator: {
        validate: (value: Express.Multer.File) => {
          if (!value) {
            return false;
          }

          return value.size < maxSize;
        },
      },
    });
  };
};

const IsMulterFileNameSafe = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IsMulterFileNameSafe.name,
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [],
      options: {
        message: args =>
          `${propertyName.toString()} name is invalid ${(<Express.Multer.File>args.value)?.originalname ?? ''}`,
        ...validationOptions,
      },
      validator: {
        validate: (value: Express.Multer.File) => {
          if (!value) {
            return false;
          }

          return value.originalname === sanitize(value.originalname);
        },
      },
    });
  };
};

export const IsStringSafeForFileOrFolder = (validationOptions?: ValidationOptions) => {
  return function (object: object, propertyName: string | symbol) {
    registerDecorator({
      name: IsStringSafeForFileOrFolder.name,
      target: object.constructor,
      propertyName: propertyName.toString(),
      constraints: [],
      options: {
        message: args => `${propertyName.toString()} name is invalid, ${args.value}`,
        ...validationOptions,
      },
      validator: {
        validate: (value: string) => value === sanitize(value),
      },
    });
  };
};

export function IsMulterFile(validateParams?: { maxSize?: number; fileTypes?: string[] }): PropertyDecorator {
  return function (target: object, propertyKey: string | symbol): void {
    IsMulterFileInstance()(target, propertyKey);
    IsMulterFileNameSafe()(target, propertyKey);
    if (validateParams?.fileTypes) IsMulterFileTypes(validateParams.fileTypes)(target, propertyKey);
    if (validateParams?.maxSize) IsMulterFileMaxSize(validateParams.maxSize)(target, propertyKey);
  };
}
