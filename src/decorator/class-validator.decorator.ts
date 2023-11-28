import { isNotEmptyObject, isObject, registerDecorator } from 'class-validator';
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

export const IsMulterFile = (
  validateParams?: {
    maxSize?: number;
    fileType?: string;
  },
  validationOptions?: ValidationOptions,
) => {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsMulterFile',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: {
        message: `${propertyName} must be file`,
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          // first check if is object and is instance of multer

          if (!isObject(value)) {
            return false;
          }

          if (!isNotEmptyObject(value)) {
            return false;
          }

          if (
            'fieldname' in value &&
            'originalname' in value &&
            'encoding' in value &&
            'mimetype' in value &&
            'buffer' in value &&
            'size' in value
          ) {
            const multerFile = value as Express.Multer.File;

            if (validateParams?.fileType) {
              return !!multerFile.mimetype.match(validateParams.fileType);
            }

            if (validateParams?.maxSize) {
              return multerFile.size < validateParams.maxSize;
            }

            return true;
          } else {
            return false;
          }
        },
      },
    });
  };
};
