import { AccountVerificationAttemptCount, Prisma } from '@prisma/client';

export type AccVerifyAttemptCountCreate = Omit<
  AccountVerificationAttemptCount,
  'id' | 'createdAt' | 'deletedAt' | 'count' | 'countIncreaseLastUpdateDate'
>;

export type AccVerifyAttemptCountUpdate = Omit<
  Prisma.AccountVerificationAttemptCountUpdateInput,
  'id' | 'createdAt' | 'deletedAt' | 'recoverPasswordId'
>;
