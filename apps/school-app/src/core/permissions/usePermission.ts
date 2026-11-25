import { useSession } from '@/state/session';
import type { PermissionKey } from './keys';

/** True when the active membership holds the key. UX only; the API still enforces it. */
export function usePermission(key: PermissionKey): boolean {
  return useSession((state) => state.activeMembership?.permissions.includes(key) ?? false);
}

/** True when the active membership holds at least one of the keys. */
export function useAnyPermission(keys: readonly PermissionKey[]): boolean {
  return useSession((state) => {
    const granted = state.activeMembership?.permissions ?? [];
    return keys.some((key) => granted.includes(key));
  });
}
