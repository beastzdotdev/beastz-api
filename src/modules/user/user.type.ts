import { Prisma, User, UserIdentity } from '@prisma/client';
import { PageOptionParams, PartialBy } from '../../model/types';

export type GetUsersParams = { searchQuery?: string; excludeId: number } & PageOptionParams;

export type CreateUserParams = Omit<User, 'id' | 'createdAt'>;

export type UserWithoutPrivateInfo = Omit<PartialBy<User, 'socketId'>, 'passwordHash' | 'isOnline'>;

export type UserWithRelations = UserWithoutPrivateInfo & {
  userIdentity?: UserIdentity | null;
};

export type UpdateUserParams = Omit<Prisma.UserUpdateInput, 'refreshTokens' | 'recoverPassword' | 'createdAt'>;

export type UserIncludeIdentity = {
  userIdentity: {
    id: number;
    isAccountVerified: boolean;
    password: string;
    isBlocked: boolean;
    strictMode: boolean;
    isLocked: boolean;
  };
  id: number;
  email: string;
  createdAt: Date;
};
