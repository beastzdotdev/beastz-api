import { Controller, Post, Body, Get, Query, Logger, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService, PrismaTx } from '@global/prisma';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { transaction } from '../../common/transaction';
import { FileStructurePublicShareService } from './file-structure-public-share.service';
import { FsPublicShareCreateOrIgnoreDto } from './dto/fs-public-share-create-or-ignore.dto';
import { FsPublishShareGetByQueryDto } from './dto/fs-publish-share-get-by-query.dto';
import { FsPublicShareUpdateByIdDto } from './dto/fs-public-share-update-by-id.dto';
import { FsPublicShareResponseDto } from './dto/response/fs-public-share-response.dto';
import { FsPublicSharePureService } from './fs-public-share-pure.service';
import { NoAuth } from '../../decorator/no-auth.decorator';
import { PublicFsPublicShareResponseDto } from './dto/response/public-fs-public-share-response.dto';
import { FileStructurePublicShareMapper } from './file-structure-public-share.mapper';

@Controller('file-structure-public-share')
export class FileStructurePublicShareController {
  private readonly logger = new Logger(FileStructurePublicShareController.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly fsPublicShareService: FileStructurePublicShareService,
    private readonly fsPublicSharePureService: FsPublicSharePureService,
    private readonly fileStructurePublicShareMapper: FileStructurePublicShareMapper,
  ) {}

  @Get('get-by')
  async getBy(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: FsPublishShareGetByQueryDto,
  ): Promise<FsPublicShareResponseDto> {
    const response = await this.fsPublicSharePureService.getBy(authPayload, queryParams);
    return this.fileStructurePublicShareMapper.map(authPayload, response);
  }

  @Get('is-enabled/:fsId')
  async isEnabled(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('fsId', ParseIntPipe) fsId: number,
  ): Promise<{ enabled: boolean; data: FsPublicShareResponseDto | null }> {
    const response = await this.fsPublicShareService.isEnabled(authPayload, fsId);
    const data = await this.fileStructurePublicShareMapper.map(authPayload, response.data);

    return {
      enabled: response.enabled,
      data,
    };
  }

  @NoAuth()
  @Get('is-enabled-public/:sharedUniqueHash')
  async isEnabledPublic(
    @Param('sharedUniqueHash') sharedUniqueHash: string,
  ): Promise<{ enabled: boolean; data: PublicFsPublicShareResponseDto | null }> {
    const response = await this.fsPublicShareService.isEnabledPublic(sharedUniqueHash);
    const data = this.fileStructurePublicShareMapper.mapPublic(response.data);
    return {
      enabled: response.enabled,
      data,
    };
  }

  @NoAuth()
  @Get('collab-active-participants-public/:fsId')
  async collabActiveParticipantsPublic(@Param('fsId', ParseIntPipe) fsId: number): Promise<string[]> {
    const response = await this.fsPublicShareService.collabActiveParticipantsPublic(fsId);
    return response;
  }

  @Post()
  async create(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: FsPublicShareCreateOrIgnoreDto,
  ): Promise<FsPublicShareResponseDto> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const response = await this.fsPublicShareService.create(authPayload, dto, tx);
      return this.fileStructurePublicShareMapper.map(authPayload, response);
    });
  }

  @Patch(':id')
  async updateById(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: FsPublicShareUpdateByIdDto,
  ): Promise<FsPublicShareResponseDto> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const response = await this.fsPublicShareService.updateById(authPayload, id, dto, tx);
      return this.fileStructurePublicShareMapper.map(authPayload, response);
    });
  }
}
