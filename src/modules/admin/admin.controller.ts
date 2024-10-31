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
import { PrismaService, PrismaTx } from '@global/prisma';
import { OnEvent } from '@nestjs/event-emitter';
import { EmitterEventFields, EmitterEvents } from '@global/event-emitter';
import { createClient, RedisClientType } from 'redis';
import { RedisService, InjectRedis } from '@global/redis';
import { AdminService } from './admin.service';
import { GetSupportTicketsQueryDto } from './dto/get-support-tickets-query.dto';
import { UpdateSupportTicketDto } from './dto/update-support-tickets.dto';
import { CreateSupportTicketsDto } from './dto/create-support-ticket.dto';
import { transaction } from '../../common/transaction';
import { NoAuth } from '../../decorator/no-auth.decorator';
import { SendMailDto } from './dto/send-mail-admin.dto';
import { AdminBasicGuard } from './admin-basic-guard';
import { NotEmptyPipe } from '../../pipe/not-empty.pipe';

@NoAuth()
@UseGuards(AdminBasicGuard)
@Controller('admin')
export class AdminController {
  private readonly logger = new Logger(AdminController.name);

  constructor(
    private readonly adminService: AdminService,
    private readonly prismaService: PrismaService,

    @InjectRedis()
    private readonly redis: RedisClientType,

    private readonly redisService: RedisService,
  ) {}

  @Get()
  async healthAdmin() {
    return 'yes you are admin';
  }

  @Get('test-envs')
  async testEnvs() {
    return this.adminService.testEnvs();
  }

  @Get('user-support-ticket')
  async getSupportTickets(@Query() queryParams: GetSupportTicketsQueryDto) {
    return this.adminService.getTickets(queryParams);
  }

  @Get('get-password')
  async getBcryptPassword(@Query('password', NotEmptyPipe) password: string): Promise<string> {
    return this.adminService.getBcryptPassword(password);
  }

  @Get('test/event-emitter')
  async testEventEmitter() {
    return this.adminService.testEventEmitter();
  }

  @Get('test/socket')
  async testSocket() {
    return this.adminService.testSocket();
  }

  @Post('send-mail')
  async senMail(@Body() dto: SendMailDto) {
    return this.adminService.sendMail(dto);
  }

  @Post('test/redis')
  testRedis() {
    return this.adminService.testRedis();
  }

  @Post('test/redis-connection-only')
  async testRedisConnectionOnly(@Body() body: any) {
    return new Promise(resolve => {
      const client = createClient(body);

      client.on('error', err => resolve(err));

      (async () => {
        await client.connect();

        const aclList = await client.sendCommand(['ACL', 'LIST']);
        console.log('ACL List:', aclList);

        await client.disconnect();

        resolve(aclList);
      })();
    });
  }

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

  @Delete('user/:userId')
  async deleteUserInfo(@Param('userId', ParseIntPipe) userId: number) {
    const affected = await this.adminService.deleteUserInfo(userId);

    return {
      msg: 'success',
      affected,
    };
  }

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

  @OnEvent(EmitterEventFields['admin.test'], { async: true })
  async onAdminTest(payload: EmitterEvents['admin.test']) {
    console.log(payload);
  }
}
