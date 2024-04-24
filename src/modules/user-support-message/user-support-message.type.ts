import { Prisma, UserSupportMessage } from '@prisma/client';

export type CreateUserSupportMessageParams = Omit<UserSupportMessage, 'id' | 'createdAt'>;
export type UpdateUserSupportMessageParams = Omit<Prisma.UserSupportMessageUpdateInput, 'id' | 'createdAt'>;
