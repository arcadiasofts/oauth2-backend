import { Body, Controller, Ip, Post, Res, UseGuards } from '@nestjs/common';
import { PasskeyService } from './passkey.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { GenerateRegistrationOptionsDto } from 'src/common/dto/passkey/generate-registration-options.dto';
import { User } from 'src/common/decorator/get-user';
import {
  VerifyAuthenticationPasskeyDto,
  VerifyRegisterPasskeyDto,
} from 'src/common/dto/passkey/verify-passkey.dto';
import type { Response } from 'express';

@Controller('passkey')
export class PasskeyController {
  constructor(private readonly passkeyService: PasskeyService) {}

  @Post('register/options')
  @UseGuards(AuthGuard)
  async generateRegistrationOptions(
    @Body() generateRegistrationOptionsDto: GenerateRegistrationOptionsDto,
    @User('id') userId: number,
  ) {
    return await this.passkeyService.generateRegistrationOptions(
      generateRegistrationOptionsDto,
      userId,
    );
  }

  @Post('register/verify')
  @UseGuards(AuthGuard)
  async verifyRegistration(
    @Body() verifyRegisterPasskeyDto: VerifyRegisterPasskeyDto,
    @User('id') userId: number,
  ) {
    return await this.passkeyService.verifyRegistration(
      verifyRegisterPasskeyDto,
      userId,
    );
  }

  @Post('login/options')
  async generateAuthenticationOptions(@Body('user_id') userId: number) {
    return await this.passkeyService.generateAuthenticationOptions(userId);
  }

  @Post('login/verify')
  async verifyAuthentication(
    @Body() verifyAuthenticationDto: VerifyAuthenticationPasskeyDto,
    @Ip() ip: string,
    @Res() res: Response,
  ) {
    const { access_token, refresh_token } =
      await this.passkeyService.verifyAuthentication(
        verifyAuthenticationDto,
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
}
