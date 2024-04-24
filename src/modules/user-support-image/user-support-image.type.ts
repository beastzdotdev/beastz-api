import { UserSupportImage } from '@prisma/client';

export type CreateUserSupportImageParams = Omit<UserSupportImage, 'id' | 'createdAt'>;
export type DeleteUserSupportImageParams = Pick<
  UserSupportImage,
  'id' | 'userId' | 'userSupportId' | 'userSupportMessageId'
>;
