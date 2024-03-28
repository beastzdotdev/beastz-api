import { Prisma, RecoverPasswordAttemptCount } from '@prisma/client';

export type RecoverPasswordAttemptCountCreate = Omit<
  RecoverPasswordAttemptCount,
  'id' | 'createdAt' | 'deletedAt' | 'count' | 'countIncreaseLastUpdateDate'
>;

export type RecoverPasswordAttemptCountUpdate = Omit<
  Prisma.RecoverPasswordAttemptCountUpdateInput,
  'id' | 'createdAt' | 'deletedAt' | 'recoverPasswordId'
>;
