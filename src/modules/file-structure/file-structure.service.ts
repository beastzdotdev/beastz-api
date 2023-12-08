import { Injectable } from '@nestjs/common';
import { CreateFileStructureDto } from './dto/create-file-structure.dto';

@Injectable()
export class FileStructureService {
  create(dto: CreateFileStructureDto) {
    console.log('='.repeat(20));
    console.log(dto);
  }
}
