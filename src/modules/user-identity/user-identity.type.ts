import { UserIdentity } from '@prisma/client';

export type CreateUserIdentityParams = Omit<
  UserIdentity,
  'id' | 'createdAt' | 'locked' | 'strictMode' | 'isAccountVerified'
>;
