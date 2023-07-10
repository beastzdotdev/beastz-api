import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';
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
  DATABASE_LOG_QUERY = true;

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
  ACCESS_TOKEN_EXPIRATION: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  REFRESH_TOKEN_EXPIRATION: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  RECOVER_PASSWORD_REQUEST_TIMEOUT_IN_MILLIS: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  ACCOUNT_VERIFICATION_REQUEST_TIMEOUT_IN_MILLIS: number;

  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  MAX_FEEDBACK_PER_DAY_COUNT: number;
}
