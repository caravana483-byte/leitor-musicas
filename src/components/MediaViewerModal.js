import React from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";

export default function MediaViewerModal({ visible, item, onClose, onPlayAudio }) {
  if (!item) return null;

  const handleOpenExternal = async () => {
    if (!item.url) return;
    try {
      const supported = await Linking.canOpenURL(item.url);
      if (supported || Platform.OS === "android") {
        await Linking.openURL(item.url);
      } else {
        Alert.alert("Aviso", "Não foi possível abrir o link no navegador.");
      }
    } catch (e) {
      Alert.alert("Erro", "Erro ao abrir ficheiro externo: " + e.message);
    }
  };

  const getMediaBadge = () => {
    switch (item.type) {
      case "image":
        return { label: "IMAGEM", color: "#3b82f6", icon: "image" };
      case "audio":
        return { label: "ÁUDIO", color: "#10b981", icon: "musical-notes" };
      case "video":
        return { label: "VÍDEO", color: "#f59e0b", icon: "videocam" };
      case "pdf":
        return { label: "PDF / DOCUMENTO", color: "#ef4444", icon: "document-text" };
      default:
        return { label: "FICHEIRO", color: "#8b5cf6", icon: "folder" };
    }
  };

  const badge = getMediaBadge();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Cabeçalho do Modal */}
          <View style={styles.header}>
            <View style={[styles.badge, { backgroundColor: badge.color }]}>
              <Ionicons name={badge.icon} size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.badgeText}>{badge.label}</Text>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Visualização de Imagem */}
            {item.type === "image" && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.url }}
                  style={styles.fullImage}
                  contentFit="contain"
                  transition={300}
                />
              </View>
            )}

            {/* Visualização de Áudio */}
            {item.type === "audio" && (
              <View style={styles.cardCenter}>
                <View style={[styles.iconCircle, { backgroundColor: "rgba(16, 185, 129, 0.15)" }]}>
                  <Ionicons name="musical-notes" size={64} color="#10b981" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {item.artist ? <Text style={styles.cardSubtitle}>{item.artist}</Text> : null}
                {item.album ? <Text style={styles.cardDetail}>{item.album}</Text> : null}

                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    onClose();
                    if (onPlayAudio) onPlayAudio(item);
                  }}
                >
                  <Ionicons name="play" size={20} color="#000000" style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>Reproduzir no Leitor</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Visualização de Vídeo */}
            {item.type === "video" && (
              <View style={styles.cardCenter}>
                <View style={[styles.iconCircle, { backgroundColor: "rgba(245, 158, 11, 0.15)" }]}>
                  <Ionicons name="videocam" size={64} color="#f59e0b" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {item.description || "Ficheiro de vídeo MP4 servido pela API"}
                </Text>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#f59e0b" }]}
                  onPress={handleOpenExternal}
                >
                  <Ionicons name="play-circle" size={20} color="#000000" style={{ marginRight: 6 }} />
                  <Text style={styles.actionButtonText}>Abrir / Reproduzir Vídeo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Visualização de PDF */}
            {item.type === "pdf" && (
              <View style={styles.cardCenter}>
                <View style={[styles.iconCircle, { backgroundColor: "rgba(239, 68, 68, 0.15)" }]}>
                  <Ionicons name="document-text" size={64} color="#ef4444" />
                </View>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardSubtitle}>
                  {item.description || "Documento PDF pronto para leitura"}
                </Text>

                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: "#ef4444" }]}
                  onPress={handleOpenExternal}
                >
                  <Ionicons name="open-outline" size={20} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={[styles.actionButtonText, { color: "#ffffff" }]}>Abrir Documento PDF</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Detalhes do ficheiro */}
            <View style={styles.metaBox}>
              <Text style={styles.metaHeader}>Detalhes do Ficheiro:</Text>
              <Text style={styles.metaRow}><Text style={styles.metaKey}>ID:</Text> {item.id}</Text>
              <Text style={styles.metaRow}><Text style={styles.metaKey}>Título:</Text> {item.title}</Text>
              <Text style={styles.metaRow}><Text style={styles.metaKey}>Tipo:</Text> {item.type}</Text>
              <Text style={styles.metaRow}><Text style={styles.metaKey}>URL:</Text> {item.url}</Text>
              {item.size_bytes ? (
                <Text style={styles.metaRow}>
                  <Text style={styles.metaKey}>Tamanho:</Text> {(item.size_bytes / 1024 / 1024).toFixed(2)} MB
                </Text>
              ) : null}
            </View>

            {/* Botão de abrir URL externa */}
            <TouchableOpacity style={styles.linkButton} onPress={handleOpenExternal}>
              <Ionicons name="globe-outline" size={16} color="#9ca3af" style={{ marginRight: 6 }} />
              <Text style={styles.linkButtonText}>Abrir URL direta no navegador</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#18181b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  closeBtn: {
    padding: 6,
    backgroundColor: "#27272a",
    borderRadius: 20,
  },
  content: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: "100%",
    height: 300,
    backgroundColor: "#09090b",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  cardCenter: {
    alignItems: "center",
    paddingVertical: 20,
  },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: "#9ca3af",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
  },
  cardDetail: {
    color: "#6b7280",
    fontSize: 12,
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1DB954",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  actionButtonText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 14,
  },
  metaBox: {
    backgroundColor: "#27272a",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    marginBottom: 12,
  },
  metaHeader: {
    color: "#e4e4e7",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 8,
  },
  metaRow: {
    color: "#a1a1aa",
    fontSize: 12,
    marginBottom: 4,
  },
  metaKey: {
    color: "#ffffff",
    fontWeight: "600",
  },
  linkButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
  },
  linkButtonText: {
    color: "#9ca3af",
    fontSize: 13,
  },
});
