import { NestFactory } from '@nestjs/core';
import { AppModule, ConfigValidationSchemaType } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService<ConfigValidationSchemaType>);
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.enableCors();
  await app.listen(configService.get<number>('PORT'));
  Logger.log(
    `🚀 Application is running on: http://localhost:${configService.get<number>('PORT')}/`,
  );
}
bootstrap();
