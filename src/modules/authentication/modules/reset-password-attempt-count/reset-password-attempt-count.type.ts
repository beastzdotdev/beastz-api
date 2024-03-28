import { Prisma, ResetPasswordAttemptCount } from '@prisma/client';

export type ResetPasswordAttemptCountCreate = Omit<
  ResetPasswordAttemptCount,
  'id' | 'createdAt' | 'deletedAt' | 'count' | 'countIncreaseLastUpdateDate'
>;

export type ResetPasswordAttemptCountUpdate = Omit<
  Prisma.ResetPasswordAttemptCountUpdateInput,
  'id' | 'createdAt' | 'deletedAt' | 'ResetPasswordId'
>;
