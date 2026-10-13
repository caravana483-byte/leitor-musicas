import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SongArtwork from "./SongArtwork";

export default function MiniPlayer({
  song,
  playing,
  currentTime = 0,
  duration = 0,
  onPlayPause,
  onNext,
  onToggleFavorite,
  onPress,
}) {
  if (!song) return null;

  const validDuration = typeof duration === "number" && !isNaN(duration) && duration > 0 ? duration : 0;
  const validCurrentTime = typeof currentTime === "number" && !isNaN(currentTime) && currentTime > 0 ? currentTime : 0;
  const progress = validDuration > 0 ? Math.min(1, Math.max(0, validCurrentTime / validDuration)) : 0;

  return (
    <View style={styles.container}>
      <View style={styles.progressBarBackground}>
        <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        <Pressable
          style={styles.touchableInfo}
          onPress={onPress}
          android_ripple={{ color: "rgba(255,255,255,0.1)" }}
        >
          <SongArtwork
            uri={song.artwork}
            size={46}
            borderRadius={8}
            gradient={song.gradient}
          />

          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={1}>
              {song.title}
            </Text>
            <Text style={styles.artist} numberOfLines={1}>
              {song.artist || "Artista desconhecido"}
            </Text>
          </View>
        </Pressable>

        <View style={styles.actions}>
          {onToggleFavorite && (
            <TouchableOpacity
              onPress={() => onToggleFavorite(song.id)}
              hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
              style={styles.btn}
            >
              <Ionicons
                name={song.isFavorite ? "heart" : "heart-outline"}
                size={22}
                color={song.isFavorite ? "#ef4444" : "#a1a1aa"}
              />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={onPlayPause}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={styles.playBtn}
          >
            <Ionicons
              name={playing ? "pause" : "play"}
              size={20}
              color="#000"
              style={{ marginLeft: playing ? 0 : 2 }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNext}
            hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
            style={styles.btn}
          >
            <Ionicons name="play-skip-forward" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: "#202024",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  progressBarBackground: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    width: "100%",
  },
  progressBarFill: {
    height: 3,
    backgroundColor: "#1DB954",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  touchableInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
    justifyContent: "center",
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  artist: {
    color: "#a1a1aa",
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  btn: {
    padding: 4,
  },
  playBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
  },
});
