import { Body, Controller, Delete, Param, ParseBoolPipe, ParseIntPipe, Put } from '@nestjs/common';
import { AdminService } from './admin.service';

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

  @Delete('user/:id')
  async deleteUserInfo(@Param('id', ParseIntPipe) id: number) {
    const affected = await this.adminService.deleteUserInfo(id);

    return {
      msg: 'success',
      affected,
    };
  }
}
