import { Prisma, UserSupport } from '@prisma/client';

export type CreateUserSupportParams = Omit<UserSupport, 'id' | 'createdAt'>;
export type UpdateUserSupportParams = Omit<Prisma.UserSupportUpdateInput, 'id' | 'createdAt'>;
