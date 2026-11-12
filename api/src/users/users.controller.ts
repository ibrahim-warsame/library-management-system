import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { UsersService } from './users.service.js';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // Stretch: @Req() gives access to req.user, which JwtStrategy.validate() set.
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  profile(@Req() req: { user: { userId: number } }) {
    return this.usersService.findProfile(req.user.userId);
  }
}
