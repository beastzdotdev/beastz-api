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
import { AdminService } from './admin.service';
import { GetSupportTicketsQueryDto } from './dto/get-support-tickets-query.dto';
import { UpdateSupportTicketDto } from './dto/update-support-tickets.dto';
import { CreateSupportTicketsDto } from './dto/create-support-ticket.dto';
import { transaction } from '../../common/transaction';
import { NoAuth } from '../../decorator/no-auth.decorator';
import { SendMailDto } from './dto/send-mail-admin.dto';
import { AdminBasicGuard } from './admin-basic-guard';
import { NotEmptyPipe } from '../../pipe/not-empty.pipe';
import { FsCollabRedisBody, HSETObject, NonNullableProperties } from '../../model/types';
import { RedisService } from '../@global/redis/redis.service';
import { InjectRedis } from '../@global/redis/redis.decorator';

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

  @Get('redis3')
  async testRedisX3(@Body() body: any) {
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

  @Get('redis4')
  async testRedisX4() {
    const x = await this.redisService.set('test', '123');
    const z = await this.redis.set('test1', 123);

    const x1 = await this.redis.get('test');
    const z1 = await this.redis.get('test1');

    console.log(x);
    console.log(z);

    console.log(x1);
    console.log(z1);
    console.log(typeof z1 === 'number');
    console.log('='.repeat(20) + 'end');

    const object: NonNullableProperties<FsCollabRedisBody> = {
      doc: 'asd',
      masterSocketId: 'null',
      masterUserId: 123123,
      servants: JSON.stringify([123123, 1231231]),
      updates: JSON.stringify([]),
    };

    const f = await this.redisService.hsetobject('testx', object as HSETObject);
    const val = await this.redisService.hget('testx', 'masterUserId');

    console.log(f);
    console.log(val);
    console.log(parseInt(val as string));
    console.log(typeof val === 'number');
    console.log('='.repeat(20));

    // const y = await this.redisService.hgetall('test');
    // console.log(y);
    // console.log('='.repeat(20));

    // const z = await this.redisService.hgetall('testx');
    // console.log(z);
    // console.log('='.repeat(20) + 'end');

    // const d = await this.redisService.hget('test', 'doc');
    // console.log(d);
    // console.log('='.repeat(20) + 'end');

    // const t = await this.redisService.hget('test', 'docx-not-exis');
    // console.log(t);
    // console.log('='.repeat(20) + 'end');

    // const aclList = await this.redis.sendCommand(['ACL', 'LIST']);
    // console.log('ACL List:', aclList);

    // const object: NonNullableProperties<FsCollabRedisBody> = {
    //   doc: 'asd',
    //   masterSocketId: 'null',
    //   masterUserId: 123123,
    //   servants: JSON.stringify([123123, 1231231]),
    //   updates: JSON.stringify([]),
    // };

    // const x = await this.redis.HSET('test', object as HSETObject);

    // console.log(x);
    // console.log('='.repeat(20));

    // const doc = await this.redis.hGet('test', 'doc');
    // const masterSocketId = await this.redis.HGET('test', 'masterSocketId');
    // const masterUserId = await this.redis.HGET('test', 'masterUserId');
    // const servants = await this.redis.HGET('test', 'servants');
    // const updates = await this.redis.HGET('test', 'updates');

    // console.log(doc, masterSocketId, masterUserId, servants, updates);
    // console.log('='.repeat(20));

    // const whole = await this.redis.HGETALL('test');
    // console.log(whole);
    // console.log('='.repeat(20));

    // const somethin = await this.redis.HGETALL('test-nonexistsn');
    // const somethin2 = await this.redis.HGET('test', 'nonexistsn');
    // const somethin3 = await this.redis.get('test-nonexistsn');

    // console.log(somethin);
    // console.log(somethin === null);
    // console.log(!!somethin);
    // console.log(somethin2);
    // console.log(somethin3);

    // console.log('='.repeat(20));

    // await this.redis.HSET('test', <FsCollabRedisBody>{
    //   doc: 'asd'
    //   masterSocketId: null,
    //   masterUserId: 123123,
    //   servants: ['123123', '1231231'],
    //   updates: [],
    // });
  }

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
