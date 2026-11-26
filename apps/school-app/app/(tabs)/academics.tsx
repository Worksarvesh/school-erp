import React from 'react';
import { usePermission } from '@/core/permissions';
import { AcademicPerformanceScreen } from '@/features/academics/screens/AcademicPerformanceScreen';
import { ModuleGroupScreen } from '@/features/dashboard/screens/ModuleGroupScreen';

/** Members who manage exams get the designed performance page; others keep their module list. */
export default function Route() {
  return usePermission('exams.manage') ? (
    <AcademicPerformanceScreen />
  ) : (
    <ModuleGroupScreen title="Academics" groups={['academics']} />
  );
}
