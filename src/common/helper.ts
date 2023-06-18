import { plainToInstance } from 'class-transformer';
import { ClassConstructor } from 'class-transformer/types/interfaces';

export function mapArray<T>(cls: ClassConstructor<T>, plain: Array<any>) {
  return plain.map((item: any) => plainToInstance(cls, item || [], { enableCircularCheck: true }));
}

export function getBoolExact(value: unknown): boolean | null {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return null;
}

export function clone<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value));
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

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
