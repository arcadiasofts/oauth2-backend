import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import expressBasicAuth from 'express-basic-auth';

async function bootstrap() {
  const logger = new Logger('Initializer');
  const app = await NestFactory.create(AppModule);
  const version = `v${require('../package.json').version}`;
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

  app.enableCors({
    origin: ['https://arcadiasofts.com', 'https://accounts.arcadiasofts.com'],
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
  });

  logger.log('Cors Enabled.');

  app.use(cookieParser);

  const config = new DocumentBuilder()
    .setTitle('Arcadia accounts')
    .setDescription('Arcadia account backend system.')
    .setVersion(version)
    .addTag('account')
    .addTag('oauth')
    .addTag('arcadia')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, documentFactory);

  const port = process.env.PORT ?? 8080;
  await app.listen(port, () => {
    logger.log(`Currently listening on port : ${port}`);
  });
}
bootstrap();
