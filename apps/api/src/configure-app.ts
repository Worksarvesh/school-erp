import { type INestApplication, ValidationPipe } from '@nestjs/common';

/** Shared by main.ts and the tests, so both serve the same routes. */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('v1');
  // DTO validation on every input; unknown fields are rejected, not silently dropped.
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  return app;
}
