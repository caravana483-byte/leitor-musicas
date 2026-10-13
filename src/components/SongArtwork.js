import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function SongArtwork({
  uri,
  size = 50,
  borderRadius = 8,
  gradient = ["#6366f1", "#a855f7"],
  style,
}) {
  const [hasError, setHasError] = useState(false);

  if (uri && !hasError) {
    return (
      <View
        style={[
          styles.container,
          { width: size, height: size, borderRadius },
          style,
        ]}
      >
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius }}
          contentFit="cover"
          transition={250}
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={gradient || ["#4f46e5", "#7c3aed"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.container,
        styles.fallback,
        { width: size, height: size, borderRadius },
        style,
      ]}
    >
      <Ionicons
        name="musical-notes"
        size={Math.max(16, size * 0.45)}
        color="rgba(255,255,255,0.9)"
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    backgroundColor: "#222",
  },
  fallback: {
    alignItems: "center",
    justifyContent: "center",
  },
});
