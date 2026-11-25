/* eslint-disable @typescript-eslint/no-require-imports -- React Native image assets are loaded with require() */
import React from 'react';
import { Image, type ImageSourcePropType, Pressable, View } from 'react-native';
import { Text, scaled } from '@school-erp/ui';
import { Tabs } from 'expo-router';
import { WebColumn } from '@/components';

/** The visible tabs, in order (approved design: floating bar with 5 tabs). */
export const TABS = [
  {
    name: 'index',
    title: 'Home',
    icon: require('../../assets/images/home/tab_home.png') as ImageSourcePropType,
  },
  {
    name: 'academic',
    title: 'Academic',
    icon: require('../../assets/images/home/tab_academic.png') as ImageSourcePropType,
  },
  {
    name: 'messages',
    title: 'Community',
    icon: require('../../assets/images/home/tab_messages.png') as ImageSourcePropType,
  },
  {
    name: 'fees',
    title: 'Fees',
    icon: require('../../assets/images/home/tab_fees.png') as ImageSourcePropType,
  },
  {
    name: 'profile',
    title: 'Profile',
    icon: require('../../assets/images/home/tab_profile.png') as ImageSourcePropType,
  },
] as const;

const INACTIVE = '#5F6B8A';
const INDICATOR = '#7B5CF0';
/** Space the floating bar covers; non-Home tabs add it as bottom padding so nothing is hidden. */
const BAR_SPACE = scaled(100);

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

/**
 * Our own floating bar. The navigator's default bar ignores left / right / bottom margins on
 * Android (it sticks to the screen edge), so this one positions itself above the safe area.
 */
function FloatingTabBar({ state, navigateToTab, insets }: TabBarProps) {
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        left: scaled(20),
        right: scaled(20),
        bottom: insets.bottom + 6,
      }}
    >
      <View
        style={{
          height: scaled(90),
          paddingBottom: scaled(12),
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: 36,
          backgroundColor: '#FFFFFF',
          shadowColor: '#3B2A7A',
          shadowOpacity: 0.16,
          shadowRadius: 22,
          shadowOffset: { width: 0, height: 4 },
          elevation: 14,
        }}
      >
        {state.routes.map((route, index) => {
          const tab = TABS.find((t) => t.name === route.name);
          if (!tab) return null;
          const focused = state.index === index;
          const onPress = () => {
            if (!focused) navigateToTab(route.key);
          };
          return (
            <Pressable
              key={route.key}
              testID={`tab-${tab.name}`}
              accessibilityRole="tab"
              accessibilityLabel={tab.title}
              accessibilityState={{ selected: focused }}
              onPress={onPress}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
            >
              <Image
                source={tab.icon}
                resizeMode="contain"
                style={{ width: scaled(34), height: scaled(34) }}
              />
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1}
                style={{
                  marginTop: 2,
                  fontSize: scaled(12),
                  fontWeight: focused ? '700' : '500',
                  color: focused ? INDICATOR : INACTIVE,
                }}
              >
                {tab.title}
              </Text>
              <View
                style={{
                  marginTop: 3,
                  width: 28,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: focused ? INDICATOR : 'transparent',
                  shadowColor: INDICATOR,
                  shadowOpacity: focused ? 0.55 : 0,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 3 },
                  elevation: focused ? 3 : 0,
                }}
              />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <WebColumn backgroundColor="#FFFFFF">
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <FloatingTabBar {...props} />}
      >
        {TABS.map((tab) => (
          <Tabs.Screen
            key={tab.name}
            name={tab.name}
            options={{
              title: tab.title,
              sceneStyle:
                tab.name === 'index'
                  ? { backgroundColor: '#FFFFFF' }
                  : { backgroundColor: '#FFFFFF', paddingBottom: BAR_SPACE },
            }}
          />
        ))}
      </Tabs>
    </WebColumn>
  );
}
