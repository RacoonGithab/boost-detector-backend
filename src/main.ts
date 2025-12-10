import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: '*',
    credentials: false,
  });
  app.getHttpAdapter().getInstance().disable('x-powered-by');
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableShutdownHooks();
  app.useGlobalPipes(new ValidationPipe());
  const config = app.get(ConfigService);
  const port = parseInt(config.get('PORT') as string, 10);
  await app.listen(port);
}
bootstrap();