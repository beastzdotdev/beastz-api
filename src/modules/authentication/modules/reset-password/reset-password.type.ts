import { ResetPassword } from '@prisma/client';

export type CreateResetPasswordParams = Omit<ResetPassword, 'id' | 'createdAt' | 'deletedAt'>;

export type UpdateResetPasswordParams = Partial<Omit<CreateResetPasswordParams, 'userId'>>;
