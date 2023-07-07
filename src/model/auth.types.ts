export type UserPayload = {
  userId: number;
  issuedAt?: number;
  expirationTime?: number;
};

export type JwtPayload = {
  userId: number;
};
