import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { FileUploadInterceptor } from '../../decorator/file-upload.decorator';
import { UpdateUserProfileImageDto } from './dto/update-user-image.dto';
import { constants } from '../../common/constants';
import { MulterFileInterceptor } from '../../interceptor/multer-file.interceptor';
import { fileStructureHelper } from '../file-structure/file-structure.helper';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('current')
  async getAuthUser(@AuthPayload() authPayload: AuthPayloadType): Promise<UserResponseDto> {
    const user = await this.userService.getById(authPayload.user.id);
    return plainToInstance(UserResponseDto, user);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.getById(id);
    return plainToInstance(UserResponseDto, user);
  }

  @Patch('current')
  async updateUserDetails(
    @Body() body: UpdateUserDetailsDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserResponseDto | null> {
    const user = await this.userService.update(authPayload.user.id, body);
    return plainToInstance(UserResponseDto, user);
  }

  @Patch('current/image')
  @FileUploadInterceptor(
    new MulterFileInterceptor({
      fileTypes: Object.values([
        fileStructureHelper.fileTypeEnumToRawMime.IMAGE_JPG,
        fileStructureHelper.fileTypeEnumToRawMime.IMAGE_PNG,
        fileStructureHelper.fileTypeEnumToRawMime.IMAGE_WEBP,
        fileStructureHelper.fileTypeEnumToRawMime.IMAGE_BMP,
      ]),
      maxSize: constants.singleFileMaxSize,
    }),
  )
  async getUserProfileImage(
    @Body() body: UpdateUserProfileImageDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserResponseDto | null> {
    const user = await this.userService.updateUserProfile(authPayload, body);
    return plainToInstance(UserResponseDto, user);
  }
}
