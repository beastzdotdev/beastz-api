import { Controller, Post, Body, Get, Query, Logger } from '@nestjs/common';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { transaction } from '../../common/transaction';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { PrismaService } from '../@global/prisma/prisma.service';
import { FileStructurePublicShareService } from './file-structure-public-share.service';

@Controller('file-structure-public-share')
export class FileStructurePublicShareController {
  private readonly logger = new Logger(FileStructurePublicShareController.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly fsPublicShareService: FileStructurePublicShareService,
  ) {}

  @Get()
  async example(@AuthPayload() _authPayload: AuthPayloadType, @Query() _queryParams: object): Promise<object> {
    return {};
  }

  @Post()
  async example2(@AuthPayload() _authPayload: AuthPayloadType, @Body() _dto: object): Promise<object> {
    return transaction.handle(this.prismaService, this.logger, async (_tx: PrismaTx) => {
      return {};
    });
  }
}
