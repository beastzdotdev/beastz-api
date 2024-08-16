import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { transaction } from '../../common/transaction';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { PrismaService } from '../@global/prisma/prisma.service';
import { FileStructurePublicShareService } from './file-structure-public-share.service';
import { FsPublicShareCreateOrIgnoreDto } from './dto/fs-public-share-create-or-ignore.dto';
import { FsPublishShareGetByQueryDto } from './dto/fs-publish-share-get-by-query.dto';

@Controller('file-structure-public-share')
export class FileStructurePublicShareController {
  private readonly logger = new Logger(FileStructurePublicShareController.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly fsPublicShareService: FileStructurePublicShareService,
  ) {}

  @Get('get-by')
  async getBy(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: FsPublishShareGetByQueryDto,
  ): Promise<object> {
    return this.fsPublicShareService.getBy(authPayload, queryParams);
  }

  @Post('create-or-ignore')
  async createOrIgnore(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: FsPublicShareCreateOrIgnoreDto,
  ): Promise<FileStructurePublicShare> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      return this.fsPublicShareService.createOrIgnore(authPayload, dto, tx);
    });
  }
}
