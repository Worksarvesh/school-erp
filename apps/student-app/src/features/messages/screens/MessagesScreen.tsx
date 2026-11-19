import { Header, Screen, StateView } from '@school-erp/ui';

/** Messages tab (V1.2): empty-state placeholder. Messaging is not in this app version yet. */
export function MessagesScreen() {
  return (
    <Screen header={<Header title="Messages" />}>
      <StateView
        state="empty"
        title="No messages yet"
        description="Messaging will be available in a future version"
        testID="messages-placeholder"
      />
    </Screen>
  );
}
