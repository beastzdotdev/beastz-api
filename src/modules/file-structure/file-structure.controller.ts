import { Controller, Post, Body, Get, Param, ParseIntPipe, Query, Patch, Res, Logger, Delete } from '@nestjs/common';
import { Response } from 'express';
import { PrismaService, PrismaTx } from '@global/prisma';
import { FileStructureService } from './file-structure.service';
import { UploadFileStructureDto } from './dto/upload-file-structure.dto';
import { FileUploadInterceptor } from '../../decorator/file-upload.decorator';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { CreateFolderStructureDto } from './dto/create-folder-structure.dto';
import { BasicFileStructureResponseDto } from './dto/response/basic-file-structure-response.dto';
import { GetDuplicateStatusDto } from './dto/get-duplicate-status-query.dto';
import { GetDuplicateStatusResponseDto } from './dto/response/get-duplicate-status-response.dto';
import { GetFileStructureContentQueryDto } from './dto/get-file-structure-content-query.dto';
import { GetGeneralInfoQueryDto } from './dto/get-general-info-query.dto';
import { GetGeneralInfoResponseDto } from './dto/response/get-general-info-response.dto';
import { UpdateFolderStructureDto } from './dto/update-folder-structure.dto';
import { RestoreFromBinDto } from './dto/restore-from-bin.dto';
import { GetDetailsQueryDto } from './dto/get-details-query.dto';
import { UploadEncryptedFileStructureDto } from './dto/upload-encrypted-file-structure.dto';
import { fileInterceptors } from '../../common/helper';
import { transaction } from '../../common/transaction';
import { ReplaceTextFileStructure } from './dto/replace-text-file-structure';
import { SearchFileStructureQueryDto } from './dto/search-file-structure-query.dto';
import { FsGetAllQueryDto } from './dto/fs-get-all-query.dto';

@Controller('file-structure')
export class FileStructureController {
  private readonly logger = new Logger(FileStructureController.name);

  constructor(
    private readonly fileStructureService: FileStructureService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get()
  async getAll(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: FsGetAllQueryDto,
  ): Promise<BasicFileStructureResponseDto[]> {
    const response = await this.fileStructureService.getAll(authPayload, queryParams);
    return BasicFileStructureResponseDto.mapArr(response);
  }

  @Get('search')
  async search(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: SearchFileStructureQueryDto,
  ): Promise<BasicFileStructureResponseDto[]> {
    const response = await this.fileStructureService.search(authPayload, queryParams);
    return BasicFileStructureResponseDto.mapArr(response);
  }

  @Get('content')
  async getContent(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: GetFileStructureContentQueryDto,
  ): Promise<BasicFileStructureResponseDto[]> {
    const response = await this.fileStructureService.getContent(authPayload, queryParams);
    return BasicFileStructureResponseDto.mapArr(response);
  }

  @Get('general-info')
  async getGeneralInfo(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: GetGeneralInfoQueryDto,
  ): Promise<GetGeneralInfoResponseDto> {
    return this.fileStructureService.getGeneralInfo(authPayload, queryParams);
  }

  @Get('details')
  async getDetails(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: GetDetailsQueryDto,
  ): Promise<BasicFileStructureResponseDto[]> {
    const response = await this.fileStructureService.getDetails(authPayload, queryParams);
    return BasicFileStructureResponseDto.mapArr(response);
  }

  @Get(':id')
  async getById(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.getById(authPayload, id);
    return BasicFileStructureResponseDto.map(response);
  }

  @Get('download/:id')
  async downloadById(
    @Res() res: Response,
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.fileStructureService.downloadById(res, authPayload, id);
  }

  @Post('duplicate-status')
  async getDuplicateStatus(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: GetDuplicateStatusDto,
  ): Promise<GetDuplicateStatusResponseDto[]> {
    return this.fileStructureService.getDuplicateStatus(authPayload, dto);
  }

  @Post('upload-file')
  @FileUploadInterceptor(...fileInterceptors(UploadFileStructureDto))
  async uploadFile(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: UploadFileStructureDto,
  ): Promise<BasicFileStructureResponseDto> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const response = await this.fileStructureService.uploadFile(dto, authPayload, tx);
      return BasicFileStructureResponseDto.map(response);
    });
  }

  @Post('upload-encrypted-file')
  @FileUploadInterceptor(...fileInterceptors(UploadEncryptedFileStructureDto))
  async uploadEncryptedFile(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: UploadEncryptedFileStructureDto,
  ): Promise<BasicFileStructureResponseDto> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const response = await this.fileStructureService.uploadEncryptedFile(dto, authPayload, tx);
      return BasicFileStructureResponseDto.map(response);
    });
  }

  @Post('create-folder')
  async createFolder(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: CreateFolderStructureDto,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.createFolder(dto, authPayload);
    return BasicFileStructureResponseDto.map(response);
  }

  @Patch(':id')
  async update(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFolderStructureDto,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.update(id, dto, authPayload);
    return BasicFileStructureResponseDto.map(response);
  }

  @Patch('replace-text/:id')
  async replaceText(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReplaceTextFileStructure,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.replaceText(id, dto, authPayload);
    return BasicFileStructureResponseDto.map(response);
  }

  @Patch('move-to-bin/:id')
  async moveToBin(@AuthPayload() authPayload: AuthPayloadType, @Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.fileStructureService.moveToBin(id, authPayload);
  }

  @Patch('restore-from-bin/:id')
  async restoreFromBin(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RestoreFromBinDto,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.restoreFromBin(id, dto, authPayload);
    return BasicFileStructureResponseDto.map(response);
  }

  @Delete('clean-up-space')
  async cleanUpSpace(@AuthPayload() authPayload: AuthPayloadType): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      return this.fileStructureService.cleanUpSpace(authPayload, tx);
    });
  }

  @Delete('delete-forever-from-bin/:id')
  async deleteForeverFromBin(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      await this.fileStructureService.deleteForeverFromBin(id, authPayload, tx);
    });
  }
}
