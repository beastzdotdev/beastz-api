import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { IsExactBoolean } from '../../../common/decorators/class-validator.decorator';
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
  RUN_AUTO_MIGRATE = true;

  @IsNotEmpty()
  @IsString()
  DATABASE_URL: string;
}
