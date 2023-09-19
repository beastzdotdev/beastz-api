import { Controller, Delete, Param, ParseIntPipe } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Delete('user/:id')
  async deleteUserInfo(@Param('id', ParseIntPipe) id: number) {
    const affected = await this.adminService.deleteUserInfo(id);

    return {
      msg: 'success',
      affected,
    };
  }
}
