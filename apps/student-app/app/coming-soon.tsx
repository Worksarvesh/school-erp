import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Header, Screen, StateView } from '@school-erp/ui';

/**
 * Placeholder for Home items shown in the design but not built in V1.2 (Sports, Puzzle,
 * Career Guidance, Events). UI only: no backend exists for these.
 */
export default function ComingSoonRoute() {
  const router = useRouter();
  const { title } = useLocalSearchParams<{ title?: string }>();
  const name = typeof title === 'string' && title.length > 0 ? title : 'This feature';

  return (
    <Screen header={<Header title={name} showBack onBack={() => router.back()} />}>
      <StateView
        state="empty"
        title="Coming soon"
        description={`${name} will be available in a future update.`}
      />
    </Screen>
  );
}
