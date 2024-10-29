import { PipeTransform, Injectable, BadRequestException, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class NotEmptyPipe implements PipeTransform<string, number> {
  transform<T>(value: unknown, metadata: ArgumentMetadata): T {
    if (!value) {
      throw new BadRequestException(`${metadata.type} param "${metadata.data}" should not be empty`);
    }

    return value as T;
  }
}
