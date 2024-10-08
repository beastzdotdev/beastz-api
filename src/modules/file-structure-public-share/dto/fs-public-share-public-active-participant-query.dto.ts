import { IsBoolean, IsNotEmpty } from 'class-validator';
import { TransformBoolean } from '../../../decorator/class-transformer.decorator';

export class FsPublicSharePublicActiveParticipantQueryDto {
  @IsNotEmpty()
  @TransformBoolean()
  @IsBoolean()
  isServant: boolean;
}
