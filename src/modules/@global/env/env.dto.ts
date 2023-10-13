import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { IsExactBoolean } from '../../../decorator/class-validator.decorator';
import { EnvironmentType } from './env.interface';

export class EnvironmentVariables {
  @IsNotEmpty()
  @IsEnum(EnvironmentType)
  DEBUG: EnvironmentType;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  PORT: number;

  @IsOptional()
  @IsExactBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  DATABASE_LOG_QUERY: boolean = true;

  @IsOptional()
  @IsExactBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  ENABLE_SESSION_ACCESS_JWT_ENCRYPTION: boolean = false;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  FRONTEND_DOMAIN: string;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;

  @IsNotEmpty()
  @IsString()
  ACCESS_TOKEN_SECRET: string;

  @IsNotEmpty()
  @IsString()
  REFRESH_TOKEN_ENCRYPTION_SECRET: string;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  ACCESS_TOKEN_EXPIRATION_IN_SEC: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  REFRESH_TOKEN_EXPIRATION_IN_SEC: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  RECOVER_PASSWORD_REQUEST_TIMEOUT_IN_SEC: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  RESET_PASSWORD_REQUEST_TIMEOUT_IN_SEC: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  ACCOUNT_VERIFICATION_TOKEN_EXPIRATION_IN_SEC: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  MAX_FEEDBACK_PER_DAY_COUNT: number;

  @IsNotEmpty()
  @IsString()
  PRISMA_ENGINE_PROTOCOL: string;

  @IsNotEmpty()
  @IsString()
  ACCOUNT_VERIFY_TOKEN_SECRET: string;

  @IsNotEmpty()
  @IsString()
  RECOVER_PASSWORD_TOKEN_SECRET: string;

  @IsNotEmpty()
  @IsString()
  RESET_PASSWORD_TOKEN_SECRET: string;

  @IsNotEmpty()
  @IsString()
  SESSION_ACCESS_JWT_ENCRYPTION_KEY: string;
}
