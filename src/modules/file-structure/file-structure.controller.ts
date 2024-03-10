import { Controller, Post, Body, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FileStructureService } from './file-structure.service';
import { UploadFileStructureDto } from './dto/upload-file-structure.dto';
import { FileUploadInterceptor } from '../../decorator/file-upload.decorator';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { CreateFolderStructureDto } from './dto/create-folder-structure.dto';
import { BasicFileStructureResponseDto } from './dto/response/basic-file-structure-response.dto';
import { DetectDuplicateQueryDto } from './dto/detect-duplicate-query.dto';
import { DetectDuplicateResponseDto } from './dto/response/detect-duplicate-response.dto';
import { MulterFileInterceptor } from '../../interceptor/multer-file.interceptor';
import { constants } from '../../common/constants';
import { fileStructureHelper } from './file-structure.helper';
import { PlainToInstanceInterceptor } from '../../interceptor/plain-to-instance.interceptor';

@Controller('file-structure')
export class FileStructureController {
  constructor(private readonly fileStructureService: FileStructureService) {}

  @Get('only-root')
  async getOnlyRootFiles(@AuthPayload() authPayload: AuthPayloadType): Promise<BasicFileStructureResponseDto[]> {
    const response = await this.fileStructureService.getRootFiles(authPayload);
    return plainToInstance(BasicFileStructureResponseDto, response);
  }

  @Get('detect-duplicate')
  async detectDuplicate(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: DetectDuplicateQueryDto,
  ): Promise<DetectDuplicateResponseDto[]> {
    return this.fileStructureService.checkIfDuplicateExists(authPayload, queryParams);
  }

  @Get(':id')
  async getById(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.getById(authPayload, id);
    return plainToInstance(BasicFileStructureResponseDto, response);
  }

  @Get('content/:parentId')
  async getContentById(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('parentId', ParseIntPipe) parentId: number,
  ): Promise<BasicFileStructureResponseDto[]> {
    const response = await this.fileStructureService.getContentByParentId(authPayload, parentId);
    return plainToInstance(BasicFileStructureResponseDto, response);
  }

  @Post('upload-file')
  @FileUploadInterceptor(
    new PlainToInstanceInterceptor(UploadFileStructureDto),
    new MulterFileInterceptor({
      fileTypes: Object.values(fileStructureHelper.fileTypeEnumToRawMime),
      maxSize: constants.singleFileMaxSize,
    }),
  )
  async uploadFile(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: UploadFileStructureDto,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.uploadFile(dto, authPayload);
    return plainToInstance(BasicFileStructureResponseDto, response);
  }

  @Post('create-folder')
  async createFolder(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: CreateFolderStructureDto,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.createFolder(dto, authPayload);
    return plainToInstance(BasicFileStructureResponseDto, response);
  }
}
