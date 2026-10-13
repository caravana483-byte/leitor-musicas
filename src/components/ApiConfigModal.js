import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { getApiUrl, setApiUrl, uploadMediaItem, fetchMediaList } from "../services/mediaApi";

export default function ApiConfigModal({ visible, onClose, onRefreshData }) {
  const [apiUrl, setApiUrlState] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);

  useEffect(() => {
    if (visible) {
      getApiUrl().then((url) => setApiUrlState(url));
    }
  }, [visible]);

  const handleSaveUrl = async () => {
    if (!apiUrl.trim()) {
      Alert.alert("Aviso", "Por favor, digite a URL da API.");
      return;
    }
    await setApiUrl(apiUrl.trim());
    Alert.alert("Sucesso", "URL da API atualizada!");
    if (onRefreshData) onRefreshData();
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    await setApiUrl(apiUrl.trim());
    const result = await fetchMediaList();
    setIsTesting(false);

    if (result.success) {
      Alert.alert("Conectado com Sucesso! ✅", `A API respondeu com ${result.data.length} itens.`);
      if (onRefreshData) onRefreshData();
    } else {
      Alert.alert("Falha na Ligação ❌", result.error || "Não foi possível ligar à API.");
    }
  };

  const handlePickFileToUpload = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: ["*/*"],
        copyToCacheDirectory: false,
      });

      if (res.canceled || !res.assets || res.assets.length === 0) return;

      const asset = res.assets[0];
      setSelectedFile(asset);
      if (!uploadTitle) {
        setUploadTitle(asset.name.replace(/\.[^/.]+$/, ""));
      }
    } catch (e) {
      Alert.alert("Erro", "Erro ao selecionar ficheiro: " + e.message);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert("Aviso", "Por favor selecione um ficheiro primeiro.");
      return;
    }

    setIsUploading(true);
    const result = await uploadMediaItem({
      fileUri: selectedFile.uri,
      fileName: selectedFile.name,
      mimeType: selectedFile.mimeType,
      title: uploadTitle || selectedFile.name,
    });
    setIsUploading(false);

    if (result.success) {
      Alert.alert("Sucesso! 🎉", "Ficheiro enviado para a API com sucesso!");
      setSelectedFile(null);
      setUploadTitle("");
      if (onRefreshData) onRefreshData();
      onClose();
    } else {
      Alert.alert("Erro no Upload", result.error || "Não foi possível enviar o ficheiro.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Configuração & Upload API</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Secção de URL da API */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🌐 URL do Backend FastAPI</Text>
              <Text style={styles.helperText}>
                {Platform.OS === "android"
                  ? "Emulador: http://10.0.2.2:8000 | Wi-Fi: http://IP_PC:8000 | Nuvem: https://sua-api.onrender.com"
                  : "Simulador: http://localhost:8000 | Wi-Fi: http://IP_PC:8000 | Nuvem: https://sua-api.onrender.com"}
              </Text>

              <TextInput
                style={styles.input}
                value={apiUrl}
                onChangeText={setApiUrlState}
                placeholder="Ex: https://minha-api.onrender.com"
                placeholderTextColor="#6b7280"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btn, styles.btnSecondary]}
                  onPress={handleTestConnection}
                  disabled={isTesting}
                >
                  {isTesting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="flash-outline" size={16} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={styles.btnSecondaryText}>Testar Ligação</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={handleSaveUrl}>
                  <Ionicons name="save-outline" size={16} color="#000000" style={{ marginRight: 4 }} />
                  <Text style={styles.btnPrimaryText}>Guardar</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Secção de Upload para a API */}
            <View style={[styles.section, { borderTopWidth: 1, borderColor: "#27272a", paddingTop: 16 }]}>
              <Text style={styles.sectionTitle}>📤 Upload de Ficheiro para a API</Text>
              <Text style={styles.helperText}>
                Envie imagens (.jpg, .png), áudios (.mp3), vídeos (.mp4) ou documentos (.pdf) para o servidor.
              </Text>

              <TouchableOpacity style={styles.pickFileBox} onPress={handlePickFileToUpload}>
                <Ionicons
                  name={selectedFile ? "checkmark-circle" : "cloud-upload-outline"}
                  size={28}
                  color={selectedFile ? "#10b981" : "#9ca3af"}
                />
                <Text style={styles.pickFileText} numberOfLines={1}>
                  {selectedFile ? selectedFile.name : "Toque para escolher ficheiro do aparelho"}
                </Text>
              </TouchableOpacity>

              {selectedFile && (
                <>
                  <Text style={[styles.label, { marginTop: 12 }]}>Título do Ficheiro:</Text>
                  <TextInput
                    style={styles.input}
                    value={uploadTitle}
                    onChangeText={setUploadTitle}
                    placeholder="Título descritivo"
                    placeholderTextColor="#6b7280"
                  />

                  <TouchableOpacity
                    style={[styles.btn, styles.btnUpload, isUploading && { opacity: 0.7 }]}
                    onPress={handleUpload}
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <>
                        <Ionicons name="cloud-upload" size={18} color="#000000" style={{ marginRight: 6 }} />
                        <Text style={styles.btnPrimaryText}>Enviar para a API</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "#18181b",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 32,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
  },
  closeBtn: {
    padding: 6,
    backgroundColor: "#27272a",
    borderRadius: 20,
  },
  scroll: {
    paddingBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  helperText: {
    color: "#9ca3af",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  label: {
    color: "#d4d4d8",
    fontSize: 13,
    marginBottom: 6,
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#27272a",
    borderRadius: 12,
    color: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnPrimary: {
    backgroundColor: "#1DB954",
  },
  btnPrimaryText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: "#3f3f46",
  },
  btnSecondaryText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  pickFileBox: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: "#52525b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#27272a",
  },
  pickFileText: {
    color: "#d4d4d8",
    fontSize: 13,
    marginTop: 6,
    fontWeight: "500",
  },
  btnUpload: {
    backgroundColor: "#1DB954",
    marginTop: 10,
  },
});
