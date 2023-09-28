import { ResetPassword } from '@prisma/client';

export type CreateResetPasswordParams = Omit<ResetPassword, 'id' | 'createdAt'>;
