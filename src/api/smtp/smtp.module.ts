import { Module } from '@nestjs/common';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { SmtpController } from './smtp.controller';
import { SmtpService } from './smtp.service';
import { ConfigModule } from '@nestjs/config';
import { SmtpConfigService } from 'src/providers/smtp/smtp.config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigModule],
      useClass: SmtpConfigService,
    }),
  ],
  controllers: [SmtpController],
  providers: [SmtpService],
})
export class SmtpModule {}
