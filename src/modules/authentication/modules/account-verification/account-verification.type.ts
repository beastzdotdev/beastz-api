import { AccountVerification } from '@prisma/client';

export type AccountVerificationParams = Omit<AccountVerification, 'id' | 'createdAt' | 'isVerified'>;
