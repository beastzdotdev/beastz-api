export type SignInParams = {
  email: string;
  password: string;
};

export type RefreshParams = {
  oldRefreshTokenString: string;
};

export type RecoverPasswordConfirmCodeParams = {
  code: number;
  email: string;
};

export type ValidateUserForAccVerifyFlags = {
  showIsVerifiedErr?: boolean;
  showNotVerifiedErr?: boolean;
};
