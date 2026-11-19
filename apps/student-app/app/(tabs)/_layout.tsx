import React from 'react';
import { Image, Text, View, type ImageSourcePropType } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '@school-erp/ui';
import { fonts } from '@/theme/fonts';
import { homeImages } from '@/theme/images';

/** The visible tabs, in the order of the approved Home design (3D icons: assets/home). */
export const TABS: readonly { name: string; title: string; image: ImageSourcePropType }[] = [
  { name: 'index', title: 'Home', image: homeImages.tabHome },
  { name: 'academic', title: 'Academic', image: homeImages.gradcap },
  { name: 'messages', title: 'Messages', image: homeImages.tabMessages },
  // Fees is out of V1.2 scope on the backend; the tab shows the existing mock-data screen.
  { name: 'fees', title: 'Fees', image: homeImages.tabFees },
  { name: 'profile', title: 'Profile', image: homeImages.tabProfile },
];

export default function TabsLayout() {
  const { colors, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 0,
          marginHorizontal: 12,
          marginBottom: 12,
          borderRadius: 28,
          height: 74,
          paddingTop: 8,
          paddingBottom: 8,
          shadowColor: isDark ? '#000000' : '#5016A8',
          shadowOpacity: 0.12,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 4 },
          elevation: 8,
        },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ focused }) => (
              <Image
                source={tab.image}
                style={{ width: 28, height: 28, opacity: focused ? 1 : 0.85 }}
                resizeMode="contain"
              />
            ),
            tabBarLabel: ({ focused, color }) => (
              <View style={{ alignItems: 'center', gap: 3 }}>
                <Text
                  style={{
                    color,
                    fontSize: 12,
                    fontFamily: focused ? fonts.semibold : fonts.medium,
                  }}
                >
                  {tab.title}
                </Text>
                <View
                  style={{
                    width: 26,
                    height: 3,
                    borderRadius: 2,
                    backgroundColor: focused ? colors.primary : 'transparent',
                  }}
                />
              </View>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
