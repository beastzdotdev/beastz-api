import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UpdateUserBodyDto } from './dto/update-user-body.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';

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
  //TODO check this
  // @ApiFile('profileImage')
  async getUserDetails(
    @Body() body: UpdateUserBodyDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserResponseDto | null> {
    const user = await this.userService.updateById(authPayload.user.id, body);
    return plainToInstance(UserResponseDto, user);
  }
}
