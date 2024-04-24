import { Body, Controller, Delete, Get, Logger, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { UserSupportResponseDto } from './dto/user-support-response.dto';
import { UserSupportService } from './user-support.service';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { UserSupportQueryAllDto } from './dto/user-support-get-all-query.dto';
import { Pagination } from '../../model/types';
import { UserSupportCreateDto } from './dto/user-support-create.dto';
import { UserSupportUpdateDto } from './dto/user-support-update.dto';
import { transaction } from '../../common/transaction';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { PrismaService } from '../@global/prisma/prisma.service';

@Controller('user-support')
export class UserSupportController {
  private readonly logger = new Logger(UserSupportController.name);

  constructor(
    private readonly userSupportService: UserSupportService,
    private readonly prismaService: PrismaService,
  ) {}

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
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const response = await this.userSupportService.create(dto, authPayload, tx);
      return plainToInstance(UserSupportResponseDto, response);
    });
  }

  @Patch(':id')
  async udpateById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UserSupportUpdateDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserSupportResponseDto> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const response = await this.userSupportService.updateById(id, dto, authPayload, tx);
      return plainToInstance(UserSupportResponseDto, response);
    });
  }

  @Delete()
  async deleteAll(@AuthPayload() authPayload: AuthPayloadType): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      await this.userSupportService.deleteAll(authPayload, tx);
    });
  }

  @Delete(':id')
  async deleteById(@Param('id', ParseIntPipe) id: number, @AuthPayload() authPayload: AuthPayloadType): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      await this.userSupportService.deleteById(id, authPayload, tx);
    });
  }
}
