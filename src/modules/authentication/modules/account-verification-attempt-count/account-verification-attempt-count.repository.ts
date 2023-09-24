import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../@global/prisma/prisma.service';

@Injectable()
export class AccountVerificationAttemptCountRepository {
  constructor(private readonly prismaService: PrismaService) {}
}
