import { IsStrongPassword } from 'class-validator';

export const StrongPassword = () =>
  IsStrongPassword(
    {
      minLength: 6,
      minNumbers: 1,
      minSymbols: 1,
      minLowercase: 4,
      minUppercase: 0,
    },
    {
      message: v => `property '${v.property}' needs to be 6 characters (min 4 lower character, 1 symbol and 1 number)`,
    },
  );
