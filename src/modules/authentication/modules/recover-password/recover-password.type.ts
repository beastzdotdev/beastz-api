import { RecoverPassword } from '@prisma/client';

export type CreateRecoverPasswordParams = Omit<RecoverPassword, 'id' | 'createdAt' | 'deletedAt'>;

export type UpdateRecoverPasswordParams = Partial<Omit<CreateRecoverPasswordParams, 'userId'>>;
