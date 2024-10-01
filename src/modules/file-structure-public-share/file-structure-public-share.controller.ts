import { Controller, Post, Body, Get, Query, Logger, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { PrismaService, PrismaTx } from '@global/prisma';
import { plainToInstance } from 'class-transformer';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { transaction } from '../../common/transaction';
import { FileStructurePublicShareService } from './file-structure-public-share.service';
import { FsPublicShareCreateOrIgnoreDto } from './dto/fs-public-share-create-or-ignore.dto';
import { FsPublishShareGetByQueryDto } from './dto/fs-publish-share-get-by-query.dto';
import { FsPublicShareUpdateByIdDto } from './dto/fs-public-share-update-by-id.dto';
import { FsPublicShareResponseDto } from './dto/response/fs-public-share-response.dto';
import { FsPublicSharePureService } from './fs-public-share-pure.service';
import { FileStructureService } from '../file-structure/file-structure.service';
import { NoAuth } from '../../decorator/no-auth.decorator';
import { PublicFsPublicShareResponseDto } from './dto/response/public-fs-public-share-response.dto';

//TODO refactor needed move used method in pure service and remove this code from controllers

@Controller('file-structure-public-share')
export class FileStructurePublicShareController {
  private readonly logger = new Logger(FileStructurePublicShareController.name);

  constructor(
    private readonly prismaService: PrismaService,
    private readonly fsPublicShareService: FileStructurePublicShareService,
    private readonly fsPublicSharePureService: FsPublicSharePureService,
    private readonly fileStructureService: FileStructureService,
  ) {}

  @Get('get-by')
  async getBy(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: FsPublishShareGetByQueryDto,
  ): Promise<FsPublicShareResponseDto> {
    const response = await this.fsPublicSharePureService.getBy(authPayload, queryParams);

    const { sharedUniqueHash, title, mimeType } = await this.fileStructureService.getByIdSelect(
      authPayload,
      response.fileStructureId,
      { sharedUniqueHash: true, title: true, mimeType: true },
    );

    return FsPublicShareResponseDto.map(response, { sharedUniqueHash, title, mimeType });
  }

  @Get('is-enabled/:fsId')
  async isEnabled(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('fsId', ParseIntPipe) fsId: number,
  ): Promise<{ enabled: boolean; data: FsPublicShareResponseDto | null }> {
    const response = await this.fsPublicShareService.isEnabled(authPayload, fsId);

    if (response.data) {
      const { sharedUniqueHash, title, mimeType } = await this.fileStructureService.getByIdSelect(
        authPayload,
        response.data.fileStructureId,
        { sharedUniqueHash: true, title: true, mimeType: true },
      );

      return {
        data: FsPublicShareResponseDto.map(response.data, { sharedUniqueHash, title, mimeType }),
        enabled: response.enabled,
      };
    }

    return {
      data: null,
      enabled: response.enabled,
    };
  }

  @NoAuth()
  @Get('is-enabled-public/:sharedUniqueHash')
  async isEnabledPublic(
    @Param('sharedUniqueHash') sharedUniqueHash: string,
  ): Promise<{ enabled: boolean; data: PublicFsPublicShareResponseDto | null }> {
    const response = await this.fsPublicShareService.isEnabledPublic(sharedUniqueHash);

    return {
      enabled: response.enabled,
      data: response.data ? plainToInstance(PublicFsPublicShareResponseDto, response.data) : null,
    };
  }

  @Post()
  async create(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: FsPublicShareCreateOrIgnoreDto,
  ): Promise<FsPublicShareResponseDto> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const response = await this.fsPublicShareService.create(authPayload, dto, tx);

      const { sharedUniqueHash, title, mimeType } = await this.fileStructureService.getByIdSelect(
        authPayload,
        response.fileStructureId,
        { sharedUniqueHash: true, title: true, mimeType: true },
      );

      return FsPublicShareResponseDto.map(response, { sharedUniqueHash, title, mimeType });
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

      const { sharedUniqueHash, title, mimeType } = await this.fileStructureService.getByIdSelect(
        authPayload,
        response.fileStructureId,
        { sharedUniqueHash: true, title: true, mimeType: true },
      );

      return FsPublicShareResponseDto.map(response, { sharedUniqueHash, title, mimeType });
    });
  }
}
