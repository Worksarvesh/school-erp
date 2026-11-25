import React from 'react';
import type { PermissionKey } from './keys';
import { usePermission } from './usePermission';

interface CanProps {
  permission: PermissionKey;
  children: React.ReactNode;
  /** Rendered when the member lacks the key (default: nothing). */
  fallback?: React.ReactNode;
}

/** Shows children only when the active membership holds `permission`. */
export function Can({ permission, children, fallback = null }: CanProps) {
  const allowed = usePermission(permission);
  return <>{allowed ? children : fallback}</>;
}
