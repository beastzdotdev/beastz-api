import { UserIdentity } from '@prisma/client';

export type CreateUserIdentityParams = Omit<
  UserIdentity,
  'id' | 'createdAt' | 'isLocked' | 'isBlocked' | 'strictMode' | 'isAccountVerified'
>;
