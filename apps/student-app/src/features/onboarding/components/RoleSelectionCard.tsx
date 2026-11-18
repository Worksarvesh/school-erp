import React, { useRef, useEffect } from 'react';
import {
  Pressable,
  View,
  Text,
  Image,
  Animated,
  StyleSheet,
  type ImageSourcePropType,
  Platform,
} from 'react-native';

export interface RoleSelectionCardProps {
  title: string;
  description: string;
  tileBgColor: string;
  imageSource?: ImageSourcePropType;
  isSelected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

export function RoleSelectionCard({
  title,
  description,
  tileBgColor,
  imageSource,
  isSelected = false,
  onPress,
  disabled = false,
  testID,
}: RoleSelectionCardProps) {
  const animatedSelection = useRef(new Animated.Value(isSelected ? 1 : 0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.timing(animatedSelection, {
      toValue: isSelected ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isSelected, animatedSelection]);

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(pressScale, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const borderColor = animatedSelection.interpolate({
    inputRange: [0, 1],
    outputRange: ['#E5E7EB', '#7000FF'],
  });

  const backgroundColor = animatedSelection.interpolate({
    inputRange: [0, 1],
    outputRange: ['#FFFFFF', '#FAF5FF'],
  });

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: pressScale }] }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title} card`}
        accessibilityState={{ selected: isSelected, disabled }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        testID={testID}
        style={styles.pressable}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              borderColor,
              backgroundColor,
              ...(isSelected ? styles.selectedShadow : styles.defaultShadow),
            },
          ]}
        >
          {/* Top Illustration Tile */}
          <View style={[styles.tileContainer, { backgroundColor: tileBgColor }]}>
            {imageSource ? (
              <Image
                source={imageSource}
                style={styles.tileImage}
                resizeMode="contain"
                accessibilityLabel={`${title} illustration`}
              />
            ) : null}
          </View>

          {/* Title */}
          <Text style={styles.titleText}>{title}</Text>

          {/* Description */}
          <Text style={styles.descriptionText} numberOfLines={3}>
            {description}
          </Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrapper: {
    flex: 1,
  },
  pressable: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    minHeight: 220,
    borderRadius: 36,
    borderWidth: 1.5,
    paddingTop: 22,
    paddingBottom: 20,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  defaultShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#7000FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 14,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  tileContainer: {
    width: 82,
    height: 82,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  tileImage: {
    width: 70,
    height: 70,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 14,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  descriptionText: {
    fontSize: 11.5,
    lineHeight: 16,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 6,
  },
});
