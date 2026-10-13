import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import { Ionicons } from "@expo/vector-icons";

function formatTime(seconds = 0) {
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function Player({
  song,
  playing,
  currentTime,
  duration,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title} numberOfLines={1}>
        {song.title}
      </Text>
      <Text style={styles.artist} numberOfLines={1}>
        {song.artist}
      </Text>

      <Slider
        style={styles.slider}
        minimumValue={0}
        maximumValue={duration > 0 ? duration : 1}
        value={currentTime}
        onSlidingComplete={onSeek}
        minimumTrackTintColor="#1DB954"
        maximumTrackTintColor="#4d4d4d"
        thumbTintColor="#1DB954"
      />

      <View style={styles.times}>
        <Text style={styles.time}>{formatTime(currentTime)}</Text>
        <Text style={styles.time}>{formatTime(duration)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity onPress={onPrev}>
          <Ionicons name="play-skip-back" size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
          <Ionicons
            name={playing ? "pause" : "play"}
            size={34}
            color="#000"
            style={{ marginLeft: playing ? 0 : 3 }}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={onNext}>
          <Ionicons name="play-skip-forward" size={32} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#562bcb",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 32,
  },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", textAlign: "center" },
  artist: { color: "#b3b3b3", fontSize: 14, textAlign: "center", marginTop: 4 },
  slider: { width: "100%", height: 40, marginTop: 16 },
  times: { flexDirection: "row", justifyContent: "space-between" },
  time: { color: "#b3b3b3", fontSize: 12 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-evenly",
    marginTop: 16,
  },
  playButton: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
  },
});