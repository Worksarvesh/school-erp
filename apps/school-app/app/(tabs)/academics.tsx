import React from 'react';
import { ModuleGroupScreen } from '@/features/dashboard/screens/ModuleGroupScreen';

export default function Route() {
  return <ModuleGroupScreen title="Academics" groups={['academics']} />;
}
