import { Injectable, NotFoundException } from '@nestjs/common';
import { UserSupportMessage } from '@prisma/client';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { AuthPayloadType } from '../../model/auth.types';
import { UserSupportMessageQueryAllDto } from './dto/user-support-message-get-all-query.dto';
import { Pagination } from '../../model/types';
import { UserSupportMessageCreateDto } from './dto/user-support-message-create.dto';
import { UserSupportMessageRepository } from './user-support-message.repository';
import { UserSupportService } from '../user-support/user-support.service';
import { UserSupportImageService } from '../user-support-image/user-support-image.service';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Injectable()
export class UserSupportMessageService {
  constructor(
    private readonly userSupportMessageRepository: UserSupportMessageRepository,
    private readonly userSupportService: UserSupportService,
    private readonly userSupportImageService: UserSupportImageService,
  ) {}

  async getById(id: number, authPayload: AuthPayloadType, tx?: PrismaTx): Promise<UserSupportMessage> {
    const response = await this.userSupportMessageRepository.getById(id, authPayload.user.id, tx);

    if (!response) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_MESSAGE_NOT_FOUND);
    }

    return response;
  }

  async getAll(
    queryParams: UserSupportMessageQueryAllDto,
    authPayload: AuthPayloadType,
    tx?: PrismaTx,
  ): Promise<Pagination<UserSupportMessage>> {
    const { userSupportId } = queryParams;

    // validate user support existence only (we do not care about whether it is open or closed)
    await this.userSupportService.existsById(userSupportId, authPayload.user.id, tx);

    const response = await this.userSupportMessageRepository.getAll(authPayload.user.id, queryParams, tx);
    return response;
  }

  async create(
    userSupportId: number,
    dto: UserSupportMessageCreateDto,
    authPayload: AuthPayloadType,
    tx?: PrismaTx,
  ): Promise<UserSupportMessage> {
    const { text, file } = dto;

    // validate before create that support exists and is not closed
    await this.userSupportService.existsAndIsNotClosed(userSupportId, authPayload, tx);

    const response = await this.userSupportMessageRepository.create(
      {
        fromAdmin: false,
        text,
        userId: authPayload.user.id,
        userSupportId,
      },
      tx,
    );

    await this.userSupportImageService.create(
      file,
      {
        userId: authPayload.user.id,
        userSupportId,
        userSupportMessageId: response.id,
      },
      authPayload,
      tx,
    );

    return response;
  }

  async deleteById(id: number, authPayload: AuthPayloadType, tx?: PrismaTx): Promise<void> {
    const { userSupportId } = await this.getById(id, authPayload);

    // validate before delete that support exists and is not closed
    await this.userSupportService.existsAndIsNotClosed(userSupportId, authPayload, tx);

    const response = await this.userSupportMessageRepository.deleteById(id, authPayload.user.id, tx);

    if (response === null) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_MESSAGE_NOT_FOUND);
    }
  }

  async existsById(id: number, userId: number, tx?: PrismaTx): Promise<void> {
    const entity = await this.userSupportMessageRepository.existsById(id, userId, tx);

    if (!entity) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_MESSAGE_NOT_FOUND);
    }
  }
}
