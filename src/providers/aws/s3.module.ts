import { S3Client } from '@aws-sdk/client-s3';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'S3_CLIENT',
      useFactory: (configService: ConfigService) => {
        return new S3Client({
          credentials: {
            accessKeyId: configService.get<string>('AWS_ACCESS_KEY') || '',
            secretAccessKey: configService.get<string>('AWS_SECRET_KEY') || '',
          },
          region: configService.get<string>('AWS_REGION') || '',
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: ['S3_CLIENT'],
})
export class S3Module {}
