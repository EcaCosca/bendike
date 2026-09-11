import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app.config.service';

const API_PREFIX = 'api/v1';
const SWAGGER_PATH = 'docs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(AppConfigService);

  app.setGlobalPrefix(API_PREFIX);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
  app.enableCors({ origin: config.corsOrigin });
  app.enableShutdownHooks();

  const openApi = new DocumentBuilder().setTitle('Bendike API').setVersion('0.1.0').addBearerAuth().build();
  SwaggerModule.setup(SWAGGER_PATH, app, SwaggerModule.createDocument(app, openApi));

  await app.listen(config.port);
  new Logger('Bootstrap').log(`Bendike API listening on port ${config.port} (Swagger UI at /${SWAGGER_PATH})`);
}
void bootstrap();
