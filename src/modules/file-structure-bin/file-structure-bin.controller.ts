import { Controller, Get, Query } from '@nestjs/common';
import { FileStructureBinService } from './file-structure-bin.service';
import { AuthPayloadType } from '../../model/auth.types';
import { Pagination } from '../../model/types';
import { GetFromBinQueryDto } from './dto/get-from-bin-query.dto';
import { AuthPayload } from '../../decorator/auth-payload.decorator';
import { BasicFileStructureBinResponseDto } from './dto/response/basic-file-structure-bin-response.dto';

@Controller('file-structure-bin')
export class FileStructureBinController {
  constructor(private readonly fileStructureBinService: FileStructureBinService) {}

  @Get()
  async getAll(
    @AuthPayload() authPayload: AuthPayloadType,
    @Query() queryParams: GetFromBinQueryDto,
  ): Promise<Pagination<BasicFileStructureBinResponseDto>> {
    const response = await this.fileStructureBinService.getAll(authPayload, queryParams);

    return {
      data: BasicFileStructureBinResponseDto.mapArr(response.data),
      total: response.total,
    };
  }
}
