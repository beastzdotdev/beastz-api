import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { FileStructurePublicShare } from '@prisma/client';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { transaction } from '../../common/transaction';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { PrismaService } from '../@global/prisma/prisma.service';
import { FileStructurePublicShareService } from './file-structure-public-share.service';
import { CreateOrIgnoreFsPublicShareDto } from './dto/create-or-ignore-fs-public-share.dto';

@Controller('file-structure-public-share')
export class FileStructurePublicShareController {
  private readonly logger = new Logger(FileStructurePublicShareController.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly fsPublicShareService: FileStructurePublicShareService,
  ) {}

  @Get()
  async example(@AuthPayload() _authPayload: AuthPayloadType, @Query() _queryParams: object): Promise<object> {
    return { x: 123 };
  }

  @Post('create-or-ignore')
  async createOrIgnore(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: CreateOrIgnoreFsPublicShareDto,
  ): Promise<FileStructurePublicShare> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      return this.fsPublicShareService.createOrIgnore(authPayload, dto, tx);
    });
  }
}
