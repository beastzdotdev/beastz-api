import { Controller, Post, Body, Get, Param, ParseIntPipe, Query, Patch } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FileStructureService } from './file-structure.service';
import { UploadFileStructureDto } from './dto/upload-file-structure.dto';
import { FileUploadInterceptor } from '../../decorator/file-upload.decorator';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { CreateFolderStructureDto } from './dto/create-folder-structure.dto';
import { BasicFileStructureResponseDto } from './dto/response/basic-file-structure-response.dto';
import { GetDuplicateStatusQueryDto } from './dto/get-duplicate-status-query.dto';
import { GetDuplicateStatusResponseDto } from './dto/response/get-duplicate-status-response.dto';
import { MulterFileInterceptor } from '../../interceptor/multer-file.interceptor';
import { constants } from '../../common/constants';
import { fileStructureHelper } from './file-structure.helper';
import { PlainToInstanceInterceptor } from '../../interceptor/plain-to-instance.interceptor';
import { GetFileStructureContentQueryDto } from './dto/get-file-structure-content-query.dto';
import { GetGeneralInfoQueryDto } from './dto/get-general-info-query.dto';
import { GetGeneralInfoResponseDto } from './dto/response/get-general-info-response.dto';
import { UpdateFolderStructureDto } from './dto/update-folder-structure.dto';

@Controller('file-structure')
export class FileStructureController {
  constructor(private readonly fileStructureService: FileStructureService) {}

  @Get('content')
  async getContent(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: GetFileStructureContentQueryDto,
  ): Promise<BasicFileStructureResponseDto[]> {
    const response = await this.fileStructureService.getContent(authPayload, queryParams);
    return plainToInstance(BasicFileStructureResponseDto, response, { exposeDefaultValues: true });
  }

  @Get('general-info')
  async getGeneralInfo(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: GetGeneralInfoQueryDto,
  ): Promise<GetGeneralInfoResponseDto> {
    return this.fileStructureService.getGeneralInfo(authPayload, queryParams);
  }

  @Get('duplicate-status')
  async getDuplicateStatus(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: GetDuplicateStatusQueryDto,
  ): Promise<GetDuplicateStatusResponseDto[]> {
    return this.fileStructureService.getDuplicateStatus(authPayload, queryParams);
  }

  @Get(':id')
  async getById(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.getById(authPayload, id);
    return plainToInstance(BasicFileStructureResponseDto, response, { exposeDefaultValues: true });
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
    return plainToInstance(BasicFileStructureResponseDto, response, { exposeDefaultValues: true });
  }

  @Post('create-folder')
  async createFolder(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: CreateFolderStructureDto,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.createFolder(dto, authPayload);
    return plainToInstance(BasicFileStructureResponseDto, response, { exposeDefaultValues: true });
  }

  @Patch('update/:id')
  async update(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFolderStructureDto,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.update(id, dto, authPayload);
    return plainToInstance(BasicFileStructureResponseDto, response, { exposeDefaultValues: true });
  }

  @Patch('move-to-bin/:id')
  async moveToBin(@AuthPayload() authPayload: AuthPayloadType, @Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.fileStructureService.moveToBin(id, authPayload);
  }
}
