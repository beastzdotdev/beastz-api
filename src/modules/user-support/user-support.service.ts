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

@Injectable()
export class UserSupportService {
  constructor(private readonly userSupportRepository: UserSupportRepository) {}

  async getById(id: number, authPayload: AuthPayloadType): Promise<UserSupport> {
    const userSupport = await this.userSupportRepository.getById(id, authPayload.user.id);

    if (!userSupport) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_NOT_FOUND);
    }

    return userSupport;
  }

  async getAll(queryParams: UserSupportQueryAllDto, authPayload: AuthPayloadType): Promise<Pagination<UserSupport>> {
    const response = await this.userSupportRepository.getAll(authPayload.user.id, queryParams);
    return response;
  }

  async create(dto: UserSupportCreateDto, authPayload: AuthPayloadType): Promise<UserSupport> {
    const { description, title } = dto;

    const response = await this.userSupportRepository.create({
      title,
      description,
      uuid: uuid(),
      status: UserSupportTicketStatus.PENDING,
      userId: authPayload.user.id,
      updatedAt: moment().toDate(),
      deletedAt: null,
    });

    return response;
  }

  async updateById(id: number, dto: UserSupportUpdateDto, authPayload: AuthPayloadType): Promise<UserSupport> {
    const { description, status, title } = dto;

    await this.existsById(id, authPayload.user.id);

    const response = await this.userSupportRepository.updateById(id, authPayload.user.id, {
      description,
      status,
      title,
    });

    return response!;
  }

  async deleteById(id: number, authPayload: AuthPayloadType): Promise<void> {
    await this.existsById(id, authPayload.user.id);

    await this.userSupportRepository.updateById(id, authPayload.user.id, {
      deletedAt: moment().toNow(),
    });
  }

  private async existsById(id: number, userId: number): Promise<void> {
    const entity = await this.userSupportRepository.existsById(id, userId);

    if (!entity) {
      throw new NotFoundException(ExceptionMessageCode.USER_SUPPORT_NOT_FOUND);
    }
  }
}
