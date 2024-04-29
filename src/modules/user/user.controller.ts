import { Body, Controller, Get, Logger, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { UpdateUserDetailsDto } from './dto/update-user-details.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { FileUploadInterceptor } from '../../decorator/file-upload.decorator';
import { UpdateUserProfileImageDto } from './dto/update-user-image.dto';
import { imageInterceptor } from '../../common/helper';
import { PrismaService } from '../@global/prisma/prisma.service';
import { transaction } from '../../common/transaction';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Controller('user')
export class UserController {
  private readonly logger = new Logger(UserController.name);
  constructor(
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('current')
  async getAuthUser(@AuthPayload() authPayload: AuthPayloadType): Promise<UserResponseDto> {
    const user = await this.userService.getById(authPayload.user.id);
    return UserResponseDto.map(user);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.getById(id);
    return UserResponseDto.map(user);
  }

  @Patch('current')
  async updateUserDetails(
    @Body() body: UpdateUserDetailsDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserResponseDto | null> {
    const user = await this.userService.update(authPayload.user.id, body);
    return UserResponseDto.map(user);
  }

  @Patch('current/image')
  @FileUploadInterceptor(...imageInterceptor(UpdateUserProfileImageDto))
  async getUserProfileImage(
    @Body() body: UpdateUserProfileImageDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserResponseDto | null> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const user = await this.userService.updateUserProfile(authPayload, body, tx);
      return UserResponseDto.map(user);
    });
  }
}
