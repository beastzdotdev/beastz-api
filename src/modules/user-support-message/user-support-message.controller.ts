import { Body, Controller, Delete, Get, Logger, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService, PrismaTx } from '@global/prisma';
import { UserSupportMessageResponseDto } from './dto/user-support-message-response.dto';
import { UserSupportMessageService } from './user-support-message.service';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { UserSupportMessageQueryAllDto } from './dto/user-support-message-get-all-query.dto';
import { Pagination } from '../../model/types';
import { UserSupportMessageCreateDto } from './dto/user-support-message-create.dto';
import { FileUploadInterceptor } from '../../decorator/file-upload.decorator';
import { transaction } from '../../common/transaction';
import { imageInterceptor } from '../../common/helper';

@Controller('user-support-message')
export class UserSupportMessageController {
  private readonly logger = new Logger(UserSupportMessageController.name);

  constructor(
    private readonly userSupportMessageService: UserSupportMessageService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  async getAll(
    @Query() queryParams: UserSupportMessageQueryAllDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<Pagination<UserSupportMessageResponseDto>> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const response = await this.userSupportMessageService.getAll(queryParams, authPayload, tx);

      return {
        data: plainToInstance(UserSupportMessageResponseDto, response.data, { exposeDefaultValues: true }),
        total: response.total,
      };
    });
  }

  @Post(':userSupportId')
  @FileUploadInterceptor(...imageInterceptor(UserSupportMessageCreateDto))
  async create(
    @Param('userSupportId', ParseIntPipe) userSupportId: number,
    @Body() dto: UserSupportMessageCreateDto,
    @AuthPayload() authPayload: AuthPayloadType,
  ): Promise<UserSupportMessageResponseDto> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const response = await this.userSupportMessageService.create(userSupportId, dto, authPayload, tx);
      return plainToInstance(UserSupportMessageResponseDto, response, { exposeDefaultValues: true });
    });
  }

  @Delete(':id')
  async deleteById(@Param('id', ParseIntPipe) id: number, @AuthPayload() authPayload: AuthPayloadType): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      await this.userSupportMessageService.deleteById(id, authPayload, tx);
    });
  }
}
