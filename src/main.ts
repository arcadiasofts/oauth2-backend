import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Initializer');
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());

  app.enableCors({
    origin: ['https://arcadiasofts.com', 'https://accounts.arcadiasofts.com'],
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
  });

  logger.log('Cors Enabled.');

  app.use(cookieParser);

  const port = process.env.PORT ?? 8080;
  await app.listen(port, () => {
    logger.log(`Currently listening on port : ${port}`);
  });
}
bootstrap();
