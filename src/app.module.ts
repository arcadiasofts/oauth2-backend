import { Logger, Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OauthModule } from './api/oauth/oauth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { TypeormConfigService } from './providers/database/typeorm.config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './api/auth/auth.module';
import { CertModule } from './api/cert/cert.module';
import { SmtpModule } from './api/smtp/smtp.module';
import { VerifyModule } from './api/verify/verify.module';
import { ApplicationModule } from './api/application/application.module';
import { ImgModule } from './api/img/img.module';
import { PreferenceModule } from './api/preference/preference.module';
import { S3Module } from './providers/aws/s3.module';
import { DevelopersModule } from './api/developers/developers.module';
import { PasskeyModule } from './api/passkey/passkey.module';
import { UserModule } from './api/user/user.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 1000 * 60 * 60,
        limit: 10,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}.local`,
        `.env.${process.env.NODE_ENV}`,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: TypeormConfigService,
    }),
    S3Module,
    AuthModule,
    OauthModule,
    CertModule,
    SmtpModule,
    VerifyModule,
    ApplicationModule,
    ImgModule,
    ConfigModule,
    PreferenceModule,
    DevelopersModule,
    PasskeyModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
