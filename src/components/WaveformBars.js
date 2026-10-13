import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";

export default function WaveformBars({ isPlaying = false, barColor = "#1DB954", count = 4, maxHeight = 18 }) {
  const animations = useRef(
    Array.from({ length: count }, () => new Animated.Value(4))
  ).current;

  useEffect(() => {
    if (isPlaying) {
      const createAnimation = (animValue, minH, maxH, duration) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(animValue, {
              toValue: maxH,
              duration,
              useNativeDriver: false,
            }),
            Animated.timing(animValue, {
              toValue: minH,
              duration,
              useNativeDriver: false,
            }),
          ])
        );
      };

      const loops = animations.map((anim, i) => {
        const minH = 4 + (i % 2) * 2;
        const maxH = maxHeight - (i % 3) * 3;
        const speed = 250 + (i * 90) % 200;
        const loop = createAnimation(anim, minH, maxH, speed);
        loop.start();
        return loop;
      });

      return () => {
        loops.forEach((l) => l.stop());
      };
    } else {
      animations.forEach((anim) => {
        Animated.timing(anim, {
          toValue: 4,
          duration: 200,
          useNativeDriver: false,
        }).start();
      });
    }
  }, [isPlaying]);

  return (
    <View style={styles.container}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: barColor,
              height: anim,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    height: 20,
    gap: 2.5,
  },
  bar: {
    width: 3,
    borderRadius: 1.5,
  },
});
