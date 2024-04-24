import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { NoEmailVerifyValidate } from '../../decorator/no-email-verify-validate.decorator';
import { GetSupportTicketsQueryDto } from './dto/get-support-tickets-query.dto';
import { UpdateSupportTicketDto } from './dto/update-support-tickets.dto';
import { CreateSupportTicketsDto } from './dto/create-support-ticket.dto';

//TODO admin roles
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('user-support-ticket')
  async getSupportTickets(@Query() queryParams: GetSupportTicketsQueryDto) {
    return this.adminService.getTickets(queryParams);
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
    const affected = await this.adminService.deleteUserFsInfo(userId);

    return {
      msg: 'success',
      affected,
    };
  }
}
