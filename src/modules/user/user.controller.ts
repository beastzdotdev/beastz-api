import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UpdateUserBodyDto } from './dto/update-user-body.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserService } from './user.service';
import { UserPayload } from '../../model/user-payload.type';
import { ApiFile } from '../../decorator/api-file.decorator';
import { AuthPayload } from '../../decorator/auth-payload.decorator';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('current')
  async getAuthUser(@AuthPayload() authPayload: UserPayload): Promise<UserResponseDto> {
    const user = await this.userService.getById(authPayload.userId);
    return plainToInstance(UserResponseDto, user);
  }

  @Get(':id')
  async getUserById(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.getById(id);
    return plainToInstance(UserResponseDto, user);
  }

  @Patch('current')
  @ApiFile('profileImage')
  async getUserDetails(
    @Body() body: UpdateUserBodyDto,
    @AuthPayload() authPayload: UserPayload,
  ): Promise<UserResponseDto | null> {
    const user = await this.userService.updateById(authPayload.userId, body);
    return plainToInstance(UserResponseDto, user);
  }
}
