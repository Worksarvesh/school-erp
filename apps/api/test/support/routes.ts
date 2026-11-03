import type { INestApplication } from '@nestjs/common';

export interface ServedRoute {
  method: string; // upper case, e.g. GET
  path: string; // e.g. /v1/schools/:schoolId/members
}

interface ExpressLayer {
  route?: { path: string; methods: Record<string, boolean> };
}

/** Every route the app really serves, read from the Express router after init. */
export function servedRoutes(app: INestApplication): ServedRoute[] {
  const express = app.getHttpAdapter().getInstance() as { router: { stack: ExpressLayer[] } };
  return express.router.stack.flatMap((layer) =>
    layer.route
      ? Object.keys(layer.route.methods).map((m) => ({
          method: m.toUpperCase(),
          path: layer.route!.path,
        }))
      : [],
  );
}

export const SCHOOL_ROUTE_PREFIX = '/v1/schools/:schoolId';

export const isSchoolRoute = (route: ServedRoute) =>
  route.path === SCHOOL_ROUTE_PREFIX || route.path.startsWith(`${SCHOOL_ROUTE_PREFIX}/`);
