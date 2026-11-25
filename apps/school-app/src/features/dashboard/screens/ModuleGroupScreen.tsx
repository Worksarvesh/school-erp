import React from 'react';
import { Header, Screen, StateView, useTheme } from '@school-erp/ui';
import { ModuleGrid } from '@/components';
import { visibleModules, type ModuleGroup } from '@/core/navigation/modules';
import { useSession } from '@/state/session';

/** A tab that lists the modules of some groups (Academics, People, ...), permission-filtered. */
export function ModuleGroupScreen({
  title,
  groups,
}: {
  title: string;
  groups: readonly ModuleGroup[];
}) {
  const { spacing } = useTheme();
  const permissions = useSession((s) => s.activeMembership?.permissions ?? []);
  const modules = visibleModules(permissions, groups);

  return (
    <Screen
      scrollable
      header={<Header title={title} />}
      contentContainerStyle={{ padding: spacing.base }}
    >
      {modules.length > 0 ? (
        <ModuleGrid modules={modules} />
      ) : (
        <StateView state="empty" title="No modules" description="You have no access here yet." />
      )}
    </Screen>
  );
}
