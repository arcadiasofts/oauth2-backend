import { Module } from '@nestjs/common';
import { CertController } from './cert.controller';
import { CertService } from './cert.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { SmtpConfigService } from 'src/providers/smtp/smtp.config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigModule],
      useClass: SmtpConfigService,
    }),
  ],
  controllers: [CertController],
  providers: [CertService],
})
export class CertModule {}
