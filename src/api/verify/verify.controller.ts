import { Controller, Get, Query } from '@nestjs/common';
import { VerifyService } from './verify.service';

@Controller('verify')
export class VerifyController {
  constructor(private readonly verifyService: VerifyService) {}

  @Get('is-handle-available')
  async isHandleAvailable(@Query('handle') handle: string) {
    return await this.verifyService.isHandleAvailable(handle);
  }

  @Get('is-oauth-redirect-uri-available')
  async isOauthRedirectURIAvailable(
    @Query('client_id') clientId: string,
    @Query('redirect_uri') redirectURI: string,
  ) {
    return await this.verifyService.isOauthRedirectURIAvailable(
      clientId,
      redirectURI,
    );
  }
}
