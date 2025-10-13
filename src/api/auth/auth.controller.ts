import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Ip,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import RegisterDto from 'src/common/dto/auth/register.dto';
import { LoginDto } from 'src/common/dto/auth/login.dto';
import type { Request, Response } from 'express';
import { errors } from 'src/common/const/errors';
import { User } from 'src/common/decorator/get-user';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Ip() ip: string,
    @Res() res: Response,
  ) {
    const user = await this.authService.validateUser(loginDto);
    const access_token = await this.authService.generateAccessToken(user);
    const refresh_token = await this.authService.generateRefreshToken(
      user,
      loginDto,
      ip,
    );
    res.setHeader('Authorization', 'Bearer ' + [access_token, refresh_token]);
    res.cookie('sid', access_token, { httpOnly: true });
    res.cookie('rid', refresh_token, {
      httpOnly: true,
    });
    res.send({
      status: 'success',
      access_token,
      refresh_token,
    });
  }

  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Ip() ip: string,
  ) {
    const rid = req.cookies['rid'];
    if (!rid) throw new ForbiddenException(errors.REQUIRES_LOGIN);
    const { access_token, refresh_token } = await this.authService.refresh(
      {
        refresh_token: rid,
      },
      ip,
    );
    res.setHeader('Authorization', 'Bearer ' + [access_token, refresh_token]);
    res.cookie('sid', access_token, { httpOnly: true });
    if (refresh_token)
      res.cookie('rid', refresh_token, {
        httpOnly: true,
      });
    res.send({
      status: 'success',
      access_token,
      refresh_token,
    });
  }

  @Get('get-session-info')
  @UseGuards(AuthGuard)
  async getSessionInfo(@User('id') userId: number) {
    return await this.authService.getSessionInfo(userId);
  }
}
