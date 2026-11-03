import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { requestIdMiddleware } from './common/request-id.js';
import { APP_CONFIG, type AppConfig } from './config/app-config.js';

/** Shared by main.ts and the tests, so both serve the same routes. */
export function configureApp(app: NestExpressApplication): NestExpressApplication {
  const config = app.get<AppConfig>(APP_CONFIG);
  // Off by default: with it on, clients could spoof X-Forwarded-For to dodge IP rate limits.
  app.set('trust proxy', config.trustProxy);
  app.use(requestIdMiddleware);
  app.setGlobalPrefix('v1');
  app.useGlobalFilters(new ApiExceptionFilter());
  // DTO validation on every input; unknown fields are rejected, not silently dropped.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  return app;
}
