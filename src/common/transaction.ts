import { HttpException, InternalServerErrorException, Logger } from '@nestjs/common';
import { PrismaService } from '../modules/@global/prisma/prisma.service';
import { PrismaTx } from '../modules/@global/prisma/prisma.type';
import { cyanLog } from './helper';

export const transaction = Object.freeze({
  async handle<T>(prismaService: PrismaService, _logger: Logger, callback: (tx: PrismaTx) => T): Promise<T> {
    try {
      return await prismaService.$transaction(async (tx: PrismaTx) => {
        return callback(tx);
      });
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      // only log non http exceptions
      cyanLog('-'.repeat(50));
      console.error(error);
      cyanLog('-'.repeat(50));

      throw new InternalServerErrorException('Something went wrong');
    }
  },
});
