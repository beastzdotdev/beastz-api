import moment from 'moment';
import { v4 as uuid } from 'uuid';
import { Injectable, NotFoundException } from '@nestjs/common';
import { UserSupport, UserSupportTicketStatus } from '@prisma/client';
import { ExceptionMessageCode } from '../../model/enum/exception-message-code.enum';
import { AuthPayloadType } from '../../model/auth.types';
import { UserSupportRepository } from './user-support.repository';
import { UserSupportQueryAllDto } from './dto/user-support-get-all-query.dto';
import { Pagination } from '../../model/types';
import { UserSupportCreateDto } from './dto/user-support-create.dto';
import { UserSupportUpdateDto } from './dto/user-support-update.dto';
import { PrismaTx } from '../@global/prisma/prisma.type';

@Injectable()
export class UserSupportService {
  constructor(private readonly userSupportRepository: UserSupportRepository) {}

  async getById(id: number, authPayload: AuthPayloadType, tx?: PrismaTx): Promise<UserSupport> {
    const userSupport = await this.userSupportRepository.getById(id, authPayload.user.id, tx);

    if (!userSupport) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_NOT_FOUND);
    }

    return userSupport;
  }

  async getAll(
    queryParams: UserSupportQueryAllDto,
    authPayload: AuthPayloadType,
    tx?: PrismaTx,
  ): Promise<Pagination<UserSupport>> {
    const response = await this.userSupportRepository.getAll(authPayload.user.id, queryParams, tx);
    return response;
  }

  async create(dto: UserSupportCreateDto, authPayload: AuthPayloadType, tx?: PrismaTx): Promise<UserSupport> {
    const { description, title } = dto;

    const response = await this.userSupportRepository.create(
      {
        title,
        description,
        uuid: uuid(),
        status: UserSupportTicketStatus.PENDING,
        userId: authPayload.user.id,
        updatedAt: moment().toDate(),
        deletedAt: null,
      },
      tx,
    );

    return response;
  }

  async updateById(
    id: number,
    dto: UserSupportUpdateDto,
    authPayload: AuthPayloadType,
    tx?: PrismaTx,
  ): Promise<UserSupport> {
    const { description, status, title } = dto;

    const response = await this.userSupportRepository.updateById(
      id,
      authPayload.user.id,
      {
        description,
        status,
        title,
      },
      tx,
    );

    if (response === null) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_NOT_FOUND);
    }

    return response!;
  }

  async deleteById(id: number, authPayload: AuthPayloadType, tx?: PrismaTx): Promise<void> {
    const response = await this.userSupportRepository.updateById(
      id,
      authPayload.user.id,
      {
        deletedAt: moment().toDate(),
      },
      tx,
    );

    if (response === null) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_NOT_FOUND);
    }
  }

  async deleteAll(authPayload: AuthPayloadType, tx: PrismaTx) {
    await this.userSupportRepository.updateAll(
      authPayload.user.id,
      {
        deletedAt: moment().toDate(),
      },
      tx,
    );
  }

  async existsById(id: number, userId: number, tx?: PrismaTx): Promise<void> {
    const entity = await this.userSupportRepository.existsById(id, userId, tx);

    if (!entity) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_NOT_FOUND);
    }
  }

  async existsAndIsNotClosed(id: number, authPayload: AuthPayloadType, tx?: PrismaTx): Promise<void> {
    const userSupport = await this.getById(id, authPayload, tx);

    if (!userSupport) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_NOT_FOUND);
    }

    if (userSupport.status !== UserSupportTicketStatus.PENDING) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_NOT_PENDING, {
        description: 'Cannot create message when user support is not in pending',
      });
    }
  }
}
