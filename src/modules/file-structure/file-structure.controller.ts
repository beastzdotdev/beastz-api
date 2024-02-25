import { Controller, Post, Body } from '@nestjs/common';
import { FileStructureService } from './file-structure.service';
import { UploadFileStructureDto } from './dto/upload-file-structure.dto';
import { MimeTypeInterceptor } from '../../decorator/mime-type.decorator';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { AuthPayloadType } from '../../model/auth.types';
import { CreateFolderStructureDto } from './dto/create-folder-structure.dto';

@Controller('file-structure')
export class FileStructureController {
  constructor(private readonly fileStructureService: FileStructureService) {}

  @Post('upload-file')
  @MimeTypeInterceptor()
  async uploadFile(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: UploadFileStructureDto,
  ): Promise<{ id: number }> {
    const response = await this.fileStructureService.uploadFile(dto, authPayload);

    console.log('='.repeat(20));
    console.log(response);

    return {
      id: response.id,
    };
  }

  @Post('create-folder')
  async createFolder(
    @AuthPayload() authPayload: AuthPayloadType,
    @Body() dto: CreateFolderStructureDto,
  ): Promise<{ id: number }> {
    const response = await this.fileStructureService.createFolder(dto, authPayload);

    console.log('='.repeat(20));
    console.log(response);

    return {
      id: response.id,
    };
  }
}
