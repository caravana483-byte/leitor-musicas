import React from "react";
import { TouchableOpacity, View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import SongArtwork from "./SongArtwork";
import WaveformBars from "./WaveformBars";

function formatDuration(seconds = 0) {
  if (!seconds || seconds <= 0) return "";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function SongItem({
  song,
  active,
  isPlaying,
  onPress,
  onToggleFavorite,
  onDelete,
}) {
  return (
    <TouchableOpacity
      style={[styles.item, active && styles.itemActive]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.artContainer}>
        <SongArtwork
          uri={song.artwork}
          size={52}
          borderRadius={8}
          gradient={song.gradient}
        />
        {active && isPlaying && (
          <View style={styles.playingOverlay}>
            <WaveformBars isPlaying={true} barColor="#1DB954" count={3} maxHeight={14} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text
          style={[styles.title, active && styles.titleActive]}
          numberOfLines={1}
        >
          {song.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {song.artist || "Artista desconhecido"}
          {song.album ? ` • ${song.album}` : ""}
        </Text>
      </View>

      <View style={styles.rightActions}>
        {song.duration > 0 && (
          <Text style={styles.duration}>{formatDuration(song.duration)}</Text>
        )}

        {onToggleFavorite && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onToggleFavorite(song.id)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Ionicons
              name={song.isFavorite ? "heart" : "heart-outline"}
              size={20}
              color={song.isFavorite ? "#ef4444" : "#666"}
            />
          </TouchableOpacity>
        )}

        {song.isImported && onDelete && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onDelete(song.id)}
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color="#ef4444" />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
    backgroundColor: "#181818",
    borderWidth: 1,
    borderColor: "transparent",
  },
  itemActive: {
    backgroundColor: "#202020",
    borderColor: "rgba(29, 185, 84, 0.35)",
  },
  artContainer: {
    position: "relative",
    marginRight: 14,
  },
  playingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  titleActive: {
    color: "#1DB954",
  },
  artist: {
    color: "#9ca3af",
    fontSize: 12,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginLeft: 8,
  },
  duration: {
    color: "#6b7280",
    fontSize: 12,
  },
  actionBtn: {
    padding: 4,
  },
});