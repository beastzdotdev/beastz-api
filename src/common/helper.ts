import * as crypto from 'crypto';
import { InternalServerErrorException } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { plainToInstance } from 'class-transformer';
import { ClassConstructor } from 'class-transformer/types/interfaces';
import { ValidationError } from 'class-validator';
import { Request } from 'express';
import { extname } from 'path';
import { match } from 'ts-pattern';
import { SafeCallResult, ExceptionType, GeneralEnumType } from '../model/types';
import { PrismaExceptionCode } from '../model/enum/prisma-exception-code.enum';
import { RandomService } from './modules/random/random.service';

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

export function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}/${hours}:${minutes}`;
}

export function todayStartEndDates(): { startDate: Date; endDate: Date } {
  const startDate = new Date();
  startDate.setUTCHours(0, 0, 0, 0);

  const endDate = new Date();
  endDate.setUTCHours(23, 59, 59, 999);

  return { startDate, endDate };
}

export function generateFileName(
  _: Request,
  file: Express.Multer.File,
  callback: (e: Error | null, f: string) => void,
) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

  const fileExtName = extname(file.originalname);
  const fileName = `${uniqueSuffix}${fileExtName || '.jpg'}`;

  callback(null, fileName);
}

export function generateRandomString(length: number): string {
  let s = '';

  for (let i = 0; i < length; i++) {
    s += RandomService.ASCII.charAt(Math.floor(Math.random() * RandomService.ASCII.length));
  }

  return s;
}

export function enumValueIncludes<E extends GeneralEnumType<E>>(someEnum: E, value: string) {
  return Object.values(someEnum).includes(value);
}
