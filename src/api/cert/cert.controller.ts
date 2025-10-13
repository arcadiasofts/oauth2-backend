import { Body, Controller, Post } from '@nestjs/common';
import { CertService } from './cert.service';
import { VerifyEmailDto } from 'src/common/dto/cert/verify-email.dto';
import { CreateEmailCertDto } from 'src/common/dto/cert/create-email-cert-info.dto';

@Controller('cert')
export class CertController {
  constructor(private readonly certService: CertService) {}

  @Post('/create/email')
  async createCertInfo(@Body() certEmailInfoDto: CreateEmailCertDto) {
    return await this.certService.createEmailCertInfo(certEmailInfoDto);
  }

  @Post('/verify/email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return await this.certService.verifyEmail(verifyEmailDto);
  }
}
