import { Prisma, User, UserIdentity } from '@prisma/client';
import { PaginationOptionParams } from '../../model/types';

export type GetUsersParams = { searchQuery?: string; excludeId: number } & PaginationOptionParams;

export type CreateUserParams = Omit<User, 'id' | 'createdAt'>;

export type UserWithoutPrivateInfo = Omit<User, 'passwordHash' | 'isOnline'>;

export type UserWithRelations = UserWithoutPrivateInfo & {
  userIdentity?: UserIdentity | null;
};

export type UpdateUserParams = Omit<Prisma.UserUpdateInput, 'refreshTokens' | 'recoverPassword' | 'createdAt'>;

// export type UserIncludeIdentity = {
//   userIdentity: {
//     id: number;
//     isAccountVerified: boolean;
//     isBlocked: boolean;
//     strictMode: boolean;
//     isLocked: boolean;
//   };
//   id: number;
//   uuid: string;
//   email: string;
//   createdAt: Date;
// };

export type UserIncludeIdentity<T extends { includesPassword: boolean }> = {
  userIdentity: {
    id: number;
    isAccountVerified: boolean;
    isBlocked: boolean;
    strictMode: boolean;
    isLocked: boolean;
  } & (T['includesPassword'] extends true ? { password: string } : NonNullable<unknown>);
  id: number;
  uuid: string;
  email: string;
  createdAt: Date;
};
//  & (T extends true ? { password: string } : { password?: never });
