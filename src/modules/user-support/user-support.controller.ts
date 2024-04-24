import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserSupportResponseDto } from './dto/user-support-response.dto';
import { UserSupportService } from './user-support.service';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { UserSupportQueryAllDto } from './dto/user-support-get-all-query.dto';
import { Pagination } from '../../model/types';
import { UserSupportCreateDto } from './dto/user-support-create.dto';
import { UserSupportUpdateDto } from './dto/user-support-update.dto';

@Controller('user')
export class SupportController {
  constructor(private readonly userSupportService: UserSupportService) {}

  @Get(':id')
  async getById(
    @Param('id', ParseIntPipe) id: number,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserSupportResponseDto> {
    const response = await this.userSupportService.getById(id, authPayload);
    return plainToInstance(UserSupportResponseDto, response);
  }

  @Get()
  async getAll(
    @Query() queryParams: UserSupportQueryAllDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<Pagination<UserSupportResponseDto>> {
    const response = await this.userSupportService.getAll(queryParams, authPayload);

    return {
      data: plainToInstance(UserSupportResponseDto, response.data),
      total: response.total,
    };
  }

  @Post()
  async create(
    @Body() dto: UserSupportCreateDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserSupportResponseDto> {
    const response = await this.userSupportService.create(dto, authPayload);
    return plainToInstance(UserSupportResponseDto, response);
  }

  @Patch(':id')
  async udpateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserSupportUpdateDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserSupportResponseDto> {
    const response = await this.userSupportService.updateById(id, dto, authPayload);
    return plainToInstance(UserSupportResponseDto, response);
  }

  @Delete(':id')
  async deleteById(@Param('id', ParseIntPipe) id: number, @AuthPayload() authPayload: AuthPayloadType): Promise<void> {
    await this.userSupportService.deleteById(id, authPayload);
  }
}
