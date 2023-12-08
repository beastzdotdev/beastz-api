import { Controller, Post, Body } from '@nestjs/common';
import { FileStructureService } from './file-structure.service';
import { CreateFileStructureDto } from './dto/create-file-structure.dto';
import { MimeTypeInterceptor } from '../../decorator/mime-type.decorator';

@Controller('file-structure')
export class FileStructureController {
  constructor(private readonly fileStructureService: FileStructureService) {}

  @Post()
  @MimeTypeInterceptor()
  create(@Body() dto: CreateFileStructureDto) {
    return this.fileStructureService.create(dto);
  }
}
