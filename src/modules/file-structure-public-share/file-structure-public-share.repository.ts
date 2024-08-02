import { Injectable } from '@nestjs/common';
import { PrismaService } from '../@global/prisma/prisma.service';

@Injectable()
export class FileStructurePublicShareRepository {
  constructor(private readonly prismaService: PrismaService) {}
}
