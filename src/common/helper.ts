import moment from 'moment';
import { Request } from 'express';
import { extname } from 'path';
import { match } from 'ts-pattern';
import { plainToInstance } from 'class-transformer';
import { ClassConstructor } from 'class-transformer/types/interfaces';
import { ValidationError } from 'class-validator';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { SafeCallResult, ExceptionType, GeneralEnumType } from '../model/types';
import { PrismaExceptionCode } from '../model/enum/prisma-exception-code.enum';

export async function prismaSafeCall<T>(call: () => T): Promise<SafeCallResult<T>> {
  try {
    const t = await call();

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

export function cyanLog<T>(val: T): void {
  console.log('\x1b[36m%s\x1b[0m', val);
}

export function plainArrayToInstance<T>(cls: ClassConstructor<T>, plain: Array<unknown>): T[] {
  return clone<T[]>(plain).map((item: any) => plainToInstance(cls, item || [], { enableCircularCheck: true }));
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

export function generateFileName(
  _: Request,
  file: Express.Multer.File,
  callback: (e: Error | null, f: string) => void,
) {
  const uniqueSuffix = moment().valueOf() + '-' + Math.round(Math.random() * 1e9);

  const fileExtName = extname(file.originalname);
  const fileName = `${uniqueSuffix}${fileExtName || '.jpg'}`;

  callback(null, fileName);
}

export function enumValueIncludes<E extends GeneralEnumType<E>>(someEnum: E, value: string) {
  return Object.values(someEnum).includes(value);
}

// Type guard function to check if 'userIdentity' is not null
export function checkNonNull<T>(val: T): val is NonNullable<T> {
  return val !== null;
}
