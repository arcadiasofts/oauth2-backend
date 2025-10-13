import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OauthService } from './oauth.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorator/get-user';
import { OauthAuthorizeDto } from 'src/common/dto/oauth/authorize.dto';
import { OauthGetTokenDto } from 'src/common/dto/oauth/get-token.dto';
import { OauthAuthGuard } from 'src/common/guards/oauth.guard';
import { Client } from 'src/common/decorator/ouath-get-client';

@Controller('oauth')
export class OauthController {
  constructor(private readonly oauthService: OauthService) {}

  @Get('application/:id')
  async getApplicationInfo(@Param('id') appId: string) {
    return await this.oauthService.getApplicationData(appId);
  }

  @Get('/connection')
  @UseGuards(AuthGuard)
  async getConnectionInfo(
    @Query('client_id') clientId: string,
    @User('id') userId: number,
  ) {
    if (!clientId)
      throw new BadRequestException('Require client id for this request.');
    return await this.oauthService.getConnectionInfo(clientId, userId);
  }

  @Post('authorize')
  @UseGuards(AuthGuard)
  async authorize(
    @Body() authorizeDto: OauthAuthorizeDto,
    @User('id') userId: number,
  ) {
    return await this.oauthService.authorize(authorizeDto, userId);
  }

  @Post('/token')
  async getToken(@Body() getTokenDto: OauthGetTokenDto) {
    return await this.oauthService.getToken(getTokenDto);
  }

  @Post('/logout')
  @UseGuards(OauthAuthGuard)
  async logout(@Client() client?: string) {}
}
