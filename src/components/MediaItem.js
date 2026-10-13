import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

export default function MediaItem({ item, onPress, onDelete }) {
  const getIconInfo = () => {
    switch (item.type) {
      case "image":
        return { name: "image", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)" };
      case "audio":
        return { name: "musical-notes", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)" };
      case "video":
        return { name: "videocam", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)" };
      case "pdf":
        return { name: "document-text", color: "#ef4444", bg: "rgba(239, 68, 68, 0.15)" };
      default:
        return { name: "document", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.15)" };
    }
  };

  const iconInfo = getIconInfo();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      {item.type === "image" && item.url ? (
        <Image
          source={{ uri: item.url }}
          style={styles.thumbnail}
          contentFit="cover"
          transition={200}
        />
      ) : (
        <View style={[styles.thumbnailPlaceholder, { backgroundColor: iconInfo.bg }]}>
          <Ionicons name={iconInfo.name} size={24} color={iconInfo.color} />
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {item.title || "Sem título"}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {item.type.toUpperCase()} {item.artist ? `• ${item.artist}` : ""}
          {item.size_bytes ? ` • ${(item.size_bytes / 1024 / 1024).toFixed(2)} MB` : ""}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#18181b",
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  thumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#27272a",
  },
  thumbnailPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  title: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  subtitle: {
    color: "#9ca3af",
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
});
