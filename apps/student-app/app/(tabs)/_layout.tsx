/* eslint-disable @typescript-eslint/no-require-imports -- React Native image assets are loaded with require() */
import React from 'react';
import { Image, type ImageSourcePropType, Text, View } from 'react-native';
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
    title: 'Messages',
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

const ACTIVE = '#4A1CA5';
const INACTIVE = '#4F46A5';
/** Space the floating bar covers; non-Home tabs add it as bottom padding so nothing is hidden. */
const BAR_SPACE = 100;

export default function TabsLayout() {
  return (
    <WebColumn backgroundColor="#FFFFFF">
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 14,
            height: 74,
            paddingTop: 8,
            paddingBottom: 8,
            borderRadius: 30,
            borderTopWidth: 0,
            backgroundColor: '#FFFFFF',
            shadowColor: '#4A1CA5',
            shadowOpacity: 0.18,
            shadowRadius: 16,
            shadowOffset: { width: 0, height: 6 },
            elevation: 12,
          },
          tabBarItemStyle: { paddingVertical: 0 },
        }}
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
              tabBarIcon: () => (
                <Image source={tab.icon} resizeMode="contain" style={{ width: 28, height: 28 }} />
              ),
              tabBarLabel: ({ focused }) => (
                <View style={{ alignItems: 'center' }}>
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: focused ? '700' : '500',
                      color: focused ? ACTIVE : INACTIVE,
                    }}
                  >
                    {tab.title}
                  </Text>
                  <View
                    style={{
                      marginTop: 3,
                      width: 28,
                      height: 3,
                      borderRadius: 2,
                      backgroundColor: focused ? '#7C5CE0' : 'transparent',
                    }}
                  />
                </View>
              ),
            }}
          />
        ))}
      </Tabs>
    </WebColumn>
  );
}
