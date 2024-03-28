import fs from 'fs';
import path from 'path';
import { match } from 'ts-pattern';
import { ValidationError, isNotEmptyObject, isObject } from 'class-validator';
import { HttpStatus, InternalServerErrorException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

import { SafeCallResult, ExceptionType, GeneralEnumType } from '../model/types';
import { PrismaExceptionCode } from '../model/enum/prisma-exception-code.enum';
import { ExceptionMessageCode } from '../model/enum/exception-message-code.enum';
import { ImportantExceptionBody } from '../model/exception.type';

export const helper = Object.freeze({
  url: {
    create<T = Record<string, string>>(url: string, params?: T) {
      const urlInstance = new URL(url);

      if (params && Object.keys(params).length) {
        const queryParams = new URLSearchParams(params);
        urlInstance.search = queryParams.toString();
      }

      return urlInstance.toString();
    },
  },
});

export async function prismaSafeCall<T>(callback: () => T): Promise<SafeCallResult<T>> {
  try {
    const t = await callback();

    return { success: true, data: t, error: null };
  } catch (e) {
    if (!(e instanceof PrismaClientKnownRequestError)) {
      throw new InternalServerErrorException();
    }

    const errorCode = match<string, ExceptionType | null>(e.code)
      .with(PrismaExceptionCode.ENTITY_NOT_FOUND, () => 'ENTITY_NOT_FOUND')
      .with(PrismaExceptionCode.FR_KEY_CONSTRAINT_FAILED, () => 'FR_KEY_CONSTRAINT_FAILED')
      .with(PrismaExceptionCode.UNIQUE_CONSTRAINT_FAILED, () => 'UNIQUE_CONSTRAINT_FAILED')
      .otherwise(() => null);

    if (!errorCode) {
      throw new InternalServerErrorException();
    }

    return { success: false, data: null, error: errorCode };
  }
}

export async function promisify<T>(callback: () => T): Promise<T> {
  return new Promise((resolve, reject) => {
    try {
      const resp = callback();
      return resolve(resp);
    } catch (error) {
      return reject(error);
    }
  });
}

export function cyanLog<T>(val: T): void {
  console.log('\x1b[36m%s\x1b[0m', val);
}

export function getBoolExact(value: unknown): boolean | null {
  const valueIsTrue = value === 'true' || value === true;
  const valueIsFalse = value === 'false' || value === false;

  if (valueIsTrue) {
    return true;
  }

  if (valueIsFalse) {
    return false;
  }

  return null;
}

export function enumMessage(prop: string, enumValue: any) {
  return `${prop} should be valid: (${Object.values(enumValue).join(', ')})`;
}

export function clone<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function exists<T>(value: T): value is NonNullable<T> {
  return value != undefined && value != null && !Number.isNaN(value);
}

export function notExists<T>(value: T): boolean {
  return !exists(value);
}

export function fields<T>() {
  return new Proxy(
    {},
    {
      get: function (_: object, prop: string | symbol): string | symbol {
        return prop;
      },
    },
  ) as {
    [P in keyof T]: P;
  };
}

export function removeDuplicates<T>(arr: T[]): T[] {
  return [...new Set(arr)];
}

export function hasDuplicates(array: Array<unknown>): boolean {
  return new Set(array).size !== array.length;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function getAllErrorConstraints(errors: ValidationError[]): string[] {
  let constraints: string[] = [];

  for (const error of errors) {
    if (error.constraints) {
      constraints = constraints.concat(Object.values(error.constraints));
    }

    if (error.children && error.children.length > 0) {
      constraints = constraints.concat(getAllErrorConstraints(error.children));
    }
  }

  return constraints;
}

export function enumValueIncludes<E extends GeneralEnumType<E>>(someEnum: E, value: string) {
  return Object.values(someEnum).includes(value);
}

// Type guard function to check if 'userIdentity' is not null
export function checkNonNull<T>(val: T): val is NonNullable<T> {
  return val !== null;
}

export function getMessageAsExceptionMessageCode(error: ImportantExceptionBody): ExceptionMessageCode {
  let message = ExceptionMessageCode.HTTP_EXCEPTION;

  if (error.statusCode === HttpStatus.INTERNAL_SERVER_ERROR) {
    message = ExceptionMessageCode.INTERNAL_ERROR;
  }

  if (
    enumValueIncludes(ExceptionMessageCode, error?.message.toString() ?? ExceptionMessageCode.HTTP_EXCEPTION.toString())
  ) {
    message = error?.message as ExceptionMessageCode;
  }

  return message;
}

export function isErrnoException(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && 'code' in error;
}

export const escapeRegExp = (value: string): string => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

//===================================================
//  ______ _ _      _          _
// |  ____(_) |    | |        | |
// | |__   _| | ___| |__   ___| |_ __   ___ _ __ ___
// |  __| | | |/ _ \ '_ \ / _ \ | '_ \ / _ \ '__/ __|
// | |    | | |  __/ | | |  __/ | |_) |  __/ |  \__ \
// |_|    |_|_|\___|_| |_|\___|_| .__/ \___|_|  |___/
//                              | |
//                              |_|
//===================================================

export const isMulterFile = (value: unknown): value is Express.Multer.File => {
  if (!isObject(value) || !isNotEmptyObject(value)) {
    return false;
  }

  return (
    'fieldname' in value &&
    'originalname' in value &&
    'encoding' in value &&
    'mimetype' in value &&
    'buffer' in value &&
    'size' in value
  );
};

export async function checkIfDirectoryExists(
  somePath: string,
  flags: { isFile: boolean; createIfNotExists?: boolean },
): Promise<boolean> {
  const dirPath = flags.isFile ? path.dirname(somePath) : somePath;

  try {
    // The directory exists
    await fs.promises.access(dirPath);

    return true;
  } catch (error: unknown) {
    if (isErrnoException(error) && error.code === 'ENOENT' && flags?.createIfNotExists) {
      await fs.promises.mkdir(dirPath, { recursive: true });
      return true;
    }

    console.log('='.repeat(20));
    console.log(error);

    return false;
  }
}

export async function deleteFile(path: string): Promise<boolean> {
  try {
    // The directory exists
    await fs.promises.unlink(path);
    return true;
  } catch (error: unknown) {
    console.log('='.repeat(20));
    console.log(error);

    return false;
  }
}

export async function deleteFolder(path: string): Promise<boolean> {
  try {
    // The directory exists
    await fs.promises.rm(path, { recursive: true, force: true });
    return true;
  } catch (error: unknown) {
    console.log('='.repeat(20));
    console.log(error);

    return false;
  }
}
