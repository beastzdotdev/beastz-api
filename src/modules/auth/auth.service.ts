import { Injectable } from '@nestjs/common';
import { PrismaService } from '../@global/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly p: PrismaService) {}

  user() {
    return this.p.user.count();
  }
}
