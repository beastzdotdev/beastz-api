import { RecoverPassword } from '@prisma/client';

export type CreateRecoverPasswordParams = Omit<RecoverPassword, 'id' | 'createdAt'>;

export type UpdateRecoverPasswordParams = Partial<Omit<CreateRecoverPasswordParams, 'userId'>>;
