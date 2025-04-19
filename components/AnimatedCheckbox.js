import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const PARTICLE_COUNT = 7;
const PARTICLE_COLORS = ['#0894FF', '#C959DD', '#FF2E54', '#FF9004'];
const angles = Array.from({ length: PARTICLE_COUNT }, (_, i) => (i * 360) / PARTICLE_COUNT);
const secondaryAngles = Array.from({ length: PARTICLE_COUNT }, (_, i) => ((i * 360) / PARTICLE_COUNT) + 15);

function getRandomColor(index) {
    return PARTICLE_COLORS[index % PARTICLE_COLORS.length];
}

export default function AnimatedCheckbox({ active }) {
  const scale = useSharedValue(1);
  const explode = useSharedValue(0);

  useEffect(() => {
    if (active) {
      scale.value = withSpring(1.4, {}, () => {
        scale.value = withSpring(1);
      });
      explode.value = withTiming(1, { duration: 800 }, () => {
        explode.value = 0;
      });
    }
  }, [active]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      zIndex: 2,
    };
  });

  const renderParticleSet = (angles, size, radius) => {
    return angles.map((angle, index) => {
      const color = getRandomColor(index);
      const particleStyle = useAnimatedStyle(() => {
        const rad = (angle * Math.PI) / 180;
        const distance = interpolate(
          explode.value,
          [0, 1],
          [0, radius],
          Extrapolate.CLAMP
        );

        const opacity = interpolate(
          explode.value,
          [0, 0.5, 1],
          [0, 1, 0],
          Extrapolate.CLAMP
        );

        return {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          top: 25 + distance * Math.sin(rad) - size / 2,
          left: 25 + distance * Math.cos(rad) - size / 2,
          opacity,
          zIndex: 4,
        };
      });

      return <Animated.View key={`p-${index}-${size}`} style={particleStyle} />;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.clippedArea}>
        {renderParticleSet(angles, 4, 25)}
        {renderParticleSet(secondaryAngles, 3, 18)}
        <Animated.View style={[styles.animatedWrapper, animatedStyle]}>
          {active ? (
            <LinearGradient
              colors={['#0894FF', '#C959DD', '#FF2E54', '#FF9004']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientCheckbox}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
            </LinearGradient>
          ) : (
            <View style={styles.checkbox}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clippedArea: {
    width: 50,
    height: 50,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  animatedWrapper: {
    borderRadius: 30,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 3,
  },
  checkbox: {
    borderRadius: 30,
    borderColor: '#FF2E54',
    borderWidth: 2,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  gradientCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
