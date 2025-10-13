import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';
import { version } from '../package.json';

async function bootstrap() {
  const logger = new Logger('Initializer');
  const app = await NestFactory.create(AppModule);
  app.use(
    ['/docs'],
    expressBasicAuth({
      challenge: true,
      users: {
        [process.env.SWAGGER_USER ?? '']: process.env.SWAGGER_PASSWORD ?? '',
      },
    }),
  );

  app.useGlobalPipes(new ValidationPipe());

  let origin: string[];
  if (process.env.NODE_ENV === 'production')
    origin = ['https://arcadiasofts.com', 'https://accounts.arcadiasofts.com'];
  else origin = ['*'];

  app.enableCors({
    origin: origin,
    redentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
  });

  logger.log('Cors Enabled.');

  app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('Arcadia accounts')
    .setDescription('Arcadia account backend system.')
    .setVersion(version)
    .addTag('account')
    .addTag('oauth')
    .addTag('arcadia')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/docs', app, documentFactory);

  const port = process.env.PORT ?? 8080;
  await app.listen(port, () => {
    logger.log(`Currently listening on port : ${port}`);
  });
}
void bootstrap();
