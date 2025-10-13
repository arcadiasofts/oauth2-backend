import { Controller, Get, Query } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('get-user-with-email')
  async getUserWithEmail(@Query('email') email: string) {
    return await this.userService.getUserIdWithEmail(email);
  }
}
