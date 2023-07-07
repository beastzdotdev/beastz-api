import { PrismaExceptionCode } from './enum/prisma-exception-code.enum';

// General
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type Debug = 'dev' | 'prod' | 'development' | 'production';

// Prisma helper
export type ExceptionType = keyof typeof PrismaExceptionCode;
export type SafeCallResult<T> = { success: boolean; error: ExceptionType | null; data: T | null };

// Pagination
export type PageOptionParams = { page: number; pageSize: number };
export type DataPage<T> = { data: T[]; total: number };
