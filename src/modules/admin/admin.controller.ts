import { Body, Controller, Delete, Param, ParseBoolPipe, ParseIntPipe, Put } from '@nestjs/common';
import { AdminService } from './admin.service';
import { NoEmailVerifyValidate } from '../../decorator/no-email-verify-validate.decorator';

//TODO admin roles
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

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
