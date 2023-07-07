import { Prisma, User } from '@prisma/client';
import { PageOptionParams } from '../../model/page-options.type';
import { PartialBy } from '../../common/types';

export type GetUsersParams = { searchQuery?: string; excludeId: number } & PageOptionParams;

export type CreateUserParams = Omit<User, 'id' | 'createdAt'>;

export type UserWithoutPrivateInfo = Omit<PartialBy<User, 'socketId'>, 'passwordHash' | 'isOnline'>;

export type UserWithRelations = UserWithoutPrivateInfo;

export type UpdateUserParams = Omit<Prisma.UserUpdateInput, 'refreshTokens' | 'recoverPassword' | 'createdAt'>;
