import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header, Screen, StateView } from '@school-erp/ui';
import { MODULES } from '@/core/navigation/modules';

/** Placeholder for a module whose backend slice is not built yet. */
export function ComingSoonScreen() {
  const router = useRouter();
  const { module } = useLocalSearchParams<{ module?: string }>();
  const found = MODULES.find((m) => m.id === module);

  return (
    <Screen
      header={
        <Header title={found?.title ?? 'Coming soon'} showBack onBack={() => router.back()} />
      }
    >
      <StateView
        state="empty"
        title="Coming soon"
        description={
          found
            ? `${found.title} arrives with backend slice ${found.slice}.`
            : 'This module is not available yet.'
        }
      />
    </Screen>
  );
}
