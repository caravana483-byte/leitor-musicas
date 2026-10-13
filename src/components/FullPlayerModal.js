import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import SongArtwork from "./SongArtwork";
import WaveformBars from "./WaveformBars";

const { width, height } = Dimensions.get("window");
const ARTWORK_SIZE = Math.min(width * 0.78, 300);

function formatTime(seconds = 0) {
  if (isNaN(seconds) || seconds == null || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const m = Math.floor(total / 60);
  const s = String(total % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function FullPlayerModal({
  visible,
  onClose,
  song,
  playing,
  currentTime = 0,
  duration = 0,
  isShuffle,
  repeatMode,
  playbackSpeed = 1.0,
  volume = 1.0,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onSkipForward10,
  onSkipBackward10,
  onToggleShuffle,
  onToggleRepeat,
  onChangeSpeed,
  onChangeVolume,
  onToggleFavorite,
}) {
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  if (!song) return null;

  const validDuration = typeof duration === "number" && !isNaN(duration) && duration > 0 ? duration : 1;
  const validCurrent = typeof currentTime === "number" && !isNaN(currentTime) && currentTime >= 0 ? currentTime : 0;
  const currentPos = isSeeking ? seekValue : validCurrent;

  const getRepeatIcon = () => {
    if (repeatMode === "one" || repeatMode === "all") return "repeat";
    return "repeat-outline";
  };

  const getRepeatColor = () => {
    return repeatMode !== "off" ? "#1DB954" : "#a1a1aa";
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={song.gradient || ["#1e1b4b", "#0f172a", "#121212"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="chevron-down" size={28} color="#fff" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerSubtitle}>A REPRODUZIR</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {song.album || "Playlist Principal"}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.speedBadge}
              onPress={onChangeSpeed}
              activeOpacity={0.7}
            >
              <Text style={styles.speedText}>{playbackSpeed}x</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.artworkContainer}>
            <View style={styles.artworkShadow}>
              <SongArtwork
                uri={song.artwork}
                size={ARTWORK_SIZE}
                borderRadius={20}
                gradient={song.gradient}
              />
            </View>
          </View>

          <View style={styles.detailsContainer}>
            <View style={styles.titleWrapper}>
              <Text style={styles.title} numberOfLines={1}>
                {song.title}
              </Text>
              <Text style={styles.artist} numberOfLines={1}>
                {song.artist || "Artista desconhecido"}
              </Text>
            </View>

            <View style={styles.titleRight}>
              <WaveformBars isPlaying={playing} barColor="#1DB954" count={4} maxHeight={16} />
              {onToggleFavorite && (
                <TouchableOpacity
                  onPress={() => onToggleFavorite(song.id)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  style={styles.favBtn}
                >
                  <Ionicons
                    name={song.isFavorite ? "heart" : "heart-outline"}
                    size={26}
                    color={song.isFavorite ? "#ef4444" : "#fff"}
                  />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.progressContainer}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={validDuration}
              value={Math.min(currentPos, validDuration)}
              onValueChange={(val) => {
                setIsSeeking(true);
                setSeekValue(val);
              }}
              onSlidingComplete={(val) => {
                setIsSeeking(false);
                onSeek(val);
              }}
              minimumTrackTintColor="#1DB954"
              maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
              thumbTintColor="#ffffff"
            />
            <View style={styles.timeLabels}>
              <Text style={styles.timeText}>{formatTime(currentPos)}</Text>
              <Text style={styles.timeText}>{formatTime(duration)}</Text>
            </View>
          </View>

          <View style={styles.controlsContainer}>
            <TouchableOpacity
              onPress={onToggleShuffle}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons
                name="shuffle"
                size={22}
                color={isShuffle ? "#1DB954" : "#a1a1aa"}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSkipBackward10}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="refresh-outline" size={22} color="#fff" style={{ transform: [{ scaleX: -1 }] }} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onPrev}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="play-skip-back" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mainPlayBtn}
              onPress={onPlayPause}
              activeOpacity={0.85}
            >
              <Ionicons
                name={playing ? "pause" : "play"}
                size={34}
                color="#000"
                style={{ marginLeft: playing ? 0 : 3 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onNext}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="play-skip-forward" size={28} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onSkipForward10}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name="refresh-outline" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={onToggleRepeat}
              style={styles.repeatBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name={getRepeatIcon()} size={22} color={getRepeatColor()} />
              {repeatMode === "one" && <Text style={styles.repeatBadge}>1</Text>}
            </TouchableOpacity>
          </View>

          <View style={styles.volumeContainer}>
            <TouchableOpacity
              onPress={() => onChangeVolume(volume > 0 ? 0 : 0.8)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={volume === 0 ? "volume-mute" : "volume-low"}
                size={20}
                color="#a1a1aa"
              />
            </TouchableOpacity>

            <Slider
              style={styles.volumeSlider}
              minimumValue={0}
              maximumValue={1}
              value={volume}
              onValueChange={onChangeVolume}
              minimumTrackTintColor="#ffffff"
              maximumTrackTintColor="rgba(255, 255, 255, 0.2)"
              thumbTintColor="#ffffff"
            />

            <Ionicons name="volume-high" size={20} color="#a1a1aa" />
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  headerBtn: {
    padding: 4,
  },
  headerCenter: {
    alignItems: "center",
    flex: 1,
    paddingHorizontal: 12,
  },
  headerSubtitle: {
    color: "#a1a1aa",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 2,
  },
  speedBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  speedText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  artworkContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: height < 700 ? 10 : 24,
  },
  artworkShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 16,
  },
  detailsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 16,
  },
  titleWrapper: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "800",
  },
  artist: {
    color: "#a1a1aa",
    fontSize: 16,
    fontWeight: "500",
    marginTop: 4,
  },
  titleRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  favBtn: {
    padding: 4,
  },
  progressContainer: {
    width: "100%",
    marginBottom: 8,
  },
  slider: {
    width: "100%",
    height: 36,
  },
  timeLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginTop: -4,
  },
  timeText: {
    color: "#a1a1aa",
    fontSize: 12,
    fontWeight: "500",
  },
  controlsContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 12,
  },
  mainPlayBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#1DB954",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1DB954",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  repeatBtn: {
    position: "relative",
  },
  repeatBadge: {
    position: "absolute",
    top: -4,
    right: -6,
    fontSize: 10,
    fontWeight: "800",
    color: "#1DB954",
  },
  volumeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 8,
    marginTop: 8,
  },
  volumeSlider: {
    flex: 1,
    height: 30,
  },
});
