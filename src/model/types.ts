import { PrismaExceptionCode } from './enum/prisma-exception-code.enum';

// General
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type GeneralEnumType<E> = Record<keyof E, number | string> & { [k: number]: string };
export type Debug = 'dev' | 'prod' | 'development' | 'production';
export interface GeneralClass {
  new (...args: any[]): any;
}

export interface BasicMessage<T = string> {
  message: T;
}

// Prisma helper
export type ExceptionType = keyof typeof PrismaExceptionCode;
export type SafeCallResult<T> = {
  success: boolean;
  error: ExceptionType | null;
  data: Awaited<T | null>;
};

// Pagination
export type PaginationOptionParams = {
  page: number;
  pageSize: number;
};
export type Pagination<T> = {
  data: T[];
  total: number;
};

export type CustomFsResponse = {
  success: boolean;
  err: NodeJS.ErrnoException | null;
};

export type TransformFlags = {
  isInBin?: boolean;
};

// For view rendering in nunjucks
export type BaseViewJsonParams = {
  pageTabTitle: string;
};

export type AuthResponseViewJsonParams = BaseViewJsonParams & {
  frontEndUrl: string;
  text: string;
};

export type AuthResponseErrorViewJsonParams = BaseViewJsonParams & {
  text: string;
};
