import { IsEnum, IsNumber, IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { IsExactBoolean } from '../../../decorator/class-validator.decorator';
import { EnvironmentType } from './env.interface';
import { TransformBoolean, TransformNumber } from '../../../decorator/class-transformer.decorator';

export class EnvironmentVariables {
  @IsNotEmpty()
  @IsEnum(EnvironmentType)
  DEBUG: EnvironmentType;

  @IsNotEmpty()
  @TransformNumber()
  @IsNumber()
  PORT: number;

  @IsOptional()
  @IsExactBoolean()
  @TransformBoolean()
  DATABASE_LOG_QUERY: boolean = true;

  @IsOptional()
  @IsExactBoolean()
  @TransformBoolean()
  ENABLE_SESSION_ACCESS_JWT_ENCRYPTION: boolean = false;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  FRONTEND_URL: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  BACKEND_URL: string;

  @IsNotEmpty()
  @IsString()
  COOKIE_SECRET: string;

  @IsNotEmpty()
  @IsString()
  MAIL_DOMAIN: string;

  @IsNotEmpty()
  @IsString()
  MAIL_API_KEY: string;

  @IsUrl()
  @IsNotEmpty()
  @IsString()
  MAIL_URL: string;

  @IsNotEmpty()
  @IsString()
  MAIL_USERNAME: string;

  @IsNotEmpty()
  @IsString()
  MAIL_FROM: string;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;

  @IsNotEmpty()
  @IsString()
  ACCESS_TOKEN_SECRET: string;

  @IsNotEmpty()
  @IsString()
  REFRESH_TOKEN_SECRET: string;

  @IsNotEmpty()
  @TransformNumber()
  @IsNumber()
  ACCESS_TOKEN_EXPIRATION_IN_SEC: number;

  @IsNotEmpty()
  @TransformNumber()
  @IsNumber()
  REFRESH_TOKEN_EXPIRATION_IN_SEC: number;

  @IsNotEmpty()
  @TransformNumber()
  @IsNumber()
  RECOVER_PASSWORD_REQUEST_TIMEOUT_IN_SEC: number;

  @IsNotEmpty()
  @TransformNumber()
  @IsNumber()
  RESET_PASSWORD_REQUEST_TIMEOUT_IN_SEC: number;

  @IsNotEmpty()
  @TransformNumber()
  @IsNumber()
  ACCOUNT_VERIFICATION_TOKEN_EXPIRATION_IN_SEC: number;

  @IsNotEmpty()
  @TransformNumber()
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
  SESSION_JWT_ENCRYPTION_KEY: string;
}
