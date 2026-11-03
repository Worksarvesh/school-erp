import type { INestApplication } from '@nestjs/common';

/** Shared by main.ts and the tests, so both serve the same routes. */
export function configureApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('v1');
  return app;
}
