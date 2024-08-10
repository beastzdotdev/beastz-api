import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { NoEmailVerifyValidate } from '../../decorator/no-email-verify-validate.decorator';
import { GetSupportTicketsQueryDto } from './dto/get-support-tickets-query.dto';
import { UpdateSupportTicketDto } from './dto/update-support-tickets.dto';
import { CreateSupportTicketsDto } from './dto/create-support-ticket.dto';
import { PrismaService } from '../@global/prisma/prisma.service';
import { transaction } from '../../common/transaction';
import { PrismaTx } from '../@global/prisma/prisma.type';
import { NoAuth } from '../../decorator/no-auth.decorator';
import { SendMailDto } from './dto/send-mail-admin.dto';
import { AdminBasicGuard } from './admin-basic-guard';

@NoAuth()
@UseGuards(AdminBasicGuard)
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly prismaService: PrismaService,
  ) {}

  @Get('test-envs')
  async testEnvs() {
    return this.adminService.testEnvs();
  }

  @Get('user-support-ticket')
  async getSupportTickets(@Query() queryParams: GetSupportTicketsQueryDto) {
    return this.adminService.getTickets(queryParams);
  }

  @Post('send-mail')
  async senMail(@Body() dto: SendMailDto) {
    return this.adminService.sendMail(dto);
  }

  @NoEmailVerifyValidate()
  @Post('user-demo-create')
  createDemoUser() {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const affected = await this.adminService.createDemoUser(tx);

      return {
        msg: 'success',
        affected,
      };
    });
  }

  @Post('user-support-ticket/answer-ticket')
  async answerTicket(@Body() dto: CreateSupportTicketsDto) {
    const response = await this.adminService.answerTicket(dto);

    return {
      msg: 'success',
      response,
    };
  }

  @Patch('user-support-ticket/:id')
  async updateTicket(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateSupportTicketDto) {
    const response = await this.adminService.updateTicket(id, dto);

    return {
      msg: 'success',
      response,
    };
  }

  @Put('user/:id/lock-status')
  async blacklistUser(@Param('id', ParseIntPipe) id: number, @Body('isLocked', ParseBoolPipe) isLocked: boolean) {
    await this.adminService.blacklistUser(id, isLocked);

    return {
      msg: 'success',
    };
  }

  @NoEmailVerifyValidate()
  @Delete('user/:userId')
  async deleteUserInfo(@Param('userId', ParseIntPipe) userId: number) {
    const affected = await this.adminService.deleteUserInfo(userId);

    return {
      msg: 'success',
      affected,
    };
  }

  @NoEmailVerifyValidate()
  @Delete('user/:userId/fs')
  async deleteUserFsInfo(@Param('userId', ParseIntPipe) userId: number) {
    return transaction.handle(this.prismaService, this.logger, async (tx: PrismaTx) => {
      const affected = await this.adminService.deleteUserFsInfo(userId, tx);

      return {
        msg: 'success',
        affected,
      };
    });
  }

  //TODO create demo user
}
