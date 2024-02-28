import { Controller, Post, Body, Get, Param, ParseIntPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { FileStructureService } from './file-structure.service';
import { UploadFileStructureDto } from './dto/upload-file-structure.dto';
import { MimeTypeInterceptor } from '../../decorator/mime-type.decorator';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { CreateFolderStructureDto } from './dto/create-folder-structure.dto';
import { plainArrayToInstance } from '../../common/helper';
import { BasicFileStructureResponseDto } from './dto/response/basic-file-structure-response.dto';

@Controller('file-structure')
export class FileStructureController {
  constructor(private readonly fileStructureService: FileStructureService) {}

  @Get('only-root')
  async getOnlyRootFiles(@AuthPayload() authPayload: AuthPayloadType): Promise<BasicFileStructureResponseDto[]> {
    const response = await this.fileStructureService.getRootFiles(authPayload);
    return plainArrayToInstance(BasicFileStructureResponseDto, response);
  }

  @Get(':id')
  async getById(
    @AuthPayload() authPayload: AuthPayloadType,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<BasicFileStructureResponseDto> {
    const response = await this.fileStructureService.getById(authPayload, id);
    return plainToInstance(BasicFileStructureResponseDto, response);
  }

  @Post('upload-file')
  @MimeTypeInterceptor(UploadFileStructureDto)
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
