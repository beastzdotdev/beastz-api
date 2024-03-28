import { AccountVerification } from '@prisma/client';

export type AccountVerificationParams = Omit<AccountVerification, 'id' | 'createdAt' | 'isVerified'>;

export type CreateAccountVerificationParams = Omit<AccountVerification, 'id' | 'createdAt' | 'deletedAt'>;

export type UpdateAccountVerificationParams = Partial<Omit<CreateAccountVerificationParams, 'userId'>>;
