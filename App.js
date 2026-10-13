import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Text,
  View,
  FlatList,
  StyleSheet,
  StatusBar,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { createAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from "expo-audio";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { defaultSongs } from "./src/data/songs";
import SongItem from "./src/components/SongItem";
import MiniPlayer from "./src/components/MiniPlayer";
import FullPlayerModal from "./src/components/FullPlayerModal";
import MediaItem from "./src/components/MediaItem";
import MediaViewerModal from "./src/components/MediaViewerModal";
import ApiConfigModal from "./src/components/ApiConfigModal";
import { fetchMediaList, deleteMediaItem } from "./src/services/mediaApi";

const STORAGE_KEY = "@leitor_musicas_armazenadas_v3";

const GRADIENT_PALETTES = [
  ["#ec4899", "#8b5cf6", "#3b82f6"],
  ["#f59e0b", "#ef4444", "#8b5cf6"],
  ["#10b981", "#06b6d4", "#3b82f6"],
  ["#6366f1", "#a855f7", "#ec4899"],
  ["#8b5cf6", "#d946ef", "#f43f5e"],
  ["#14b8a6", "#0ea5e9", "#6366f1"],
];

function MainScreen() {
  // Navegação principal: "local" (músicas locais) ou "api" (media da API FastAPI)
  const [activeSection, setActiveSection] = useState("local");

  // Estados das músicas locais
  const [songsList, setSongsList] = useState(defaultSongs);
  const [isLoadingStorage, setIsLoadingStorage] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState("all");
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1.0);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTab, setSelectedTab] = useState("all");

  // Estados da API de Media
  const [apiMediaList, setApiMediaList] = useState([]);
  const [isLoadingApi, setIsLoadingApi] = useState(false);
  const [apiFilterType, setApiFilterType] = useState("all");
  const [selectedMediaItem, setSelectedMediaItem] = useState(null);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
  const [apiErrorMessage, setApiErrorMessage] = useState(null);

  const player = useMemo(() => createAudioPlayer(null), []);
  const status = useAudioPlayerStatus(player);

  const currentSong = songsList[currentIndex] || songsList[0] || null;

  useEffect(() => {
    return () => {
      try {
        player.remove();
      } catch (e) {
        console.warn(e);
      }
    };
  }, [player]);

  useEffect(() => {
    async function configureAudio() {
      try {
        await setAudioModeAsync({
          playsInSilentMode: true,
          shouldPlayInBackground: true,
        });
      } catch (e) {
        console.warn(e);
      }
    }
    configureAudio();
  }, []);

  // Carregar músicas salvas no telemóvel
  useEffect(() => {
    async function loadSavedSongs() {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSongsList(parsed);
          } else {
            setSongsList(defaultSongs);
          }
        } else {
          setSongsList(defaultSongs);
        }
      } catch (e) {
        setSongsList(defaultSongs);
      } finally {
        setIsLoadingStorage(false);
      }
    }
    loadSavedSongs();
  }, []);

  // Carregar dados da API FastAPI
  const loadApiMedia = useCallback(async (typeFilter = "all") => {
    setIsLoadingApi(true);
    setApiErrorMessage(null);
    const result = await fetchMediaList(typeFilter === "all" ? null : typeFilter);
    setIsLoadingApi(false);

    if (result.success) {
      setApiMediaList(result.data);
    } else {
      setApiErrorMessage(result.error);
    }
  }, []);

  useEffect(() => {
    if (activeSection === "api") {
      loadApiMedia(apiFilterType);
    }
  }, [activeSection, apiFilterType, loadApiMedia]);

  const saveSongs = async (newList) => {
    setSongsList(newList);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {
      console.warn(e);
    }
  };

  const playSongAt = (newIndex) => {
    if (newIndex < 0 || newIndex >= songsList.length) return;
    setCurrentIndex(newIndex);
    const targetSong = songsList[newIndex];
    if (targetSong?.uri) {
      try {
        player.replace(targetSong.uri);
        player.play();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  // Reproduzir um áudio que veio da API FastAPI
  const handlePlayApiAudio = (mediaItem) => {
    const apiSong = {
      id: `api_${mediaItem.id}`,
      title: mediaItem.title,
      artist: mediaItem.artist || "API FastAPI",
      album: mediaItem.album || "Nuvem",
      duration: 0,
      artwork: null,
      uri: mediaItem.url,
      isFavorite: false,
      isImported: true,
      gradient: ["#10b981", "#06b6d4", "#3b82f6"],
    };

    // Adiciona à lista se ainda não estiver
    const existingIndex = songsList.findIndex((s) => s.uri === mediaItem.url);
    if (existingIndex >= 0) {
      playSongAt(existingIndex);
    } else {
      const updated = [apiSong, ...songsList];
      saveSongs(updated);
      setCurrentIndex(0);
      try {
        player.replace(apiSong.uri);
        player.play();
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleNext = () => {
    if (songsList.length === 0) return;

    if (isShuffle && songsList.length > 1) {
      let randomIndex = currentIndex;
      while (randomIndex === currentIndex) {
        randomIndex = Math.floor(Math.random() * songsList.length);
      }
      playSongAt(randomIndex);
      return;
    }

    const nextIndex = (currentIndex + 1) % songsList.length;
    playSongAt(nextIndex);
  };

  const handlePrev = () => {
    if (songsList.length === 0) return;

    if (status.currentTime > 3) {
      try {
        player.seekTo(0);
      } catch (e) {
        console.warn(e);
      }
      return;
    }

    if (isShuffle && songsList.length > 1) {
      const randomIndex = Math.floor(Math.random() * songsList.length);
      playSongAt(randomIndex);
      return;
    }

    const prevIndex = (currentIndex - 1 + songsList.length) % songsList.length;
    playSongAt(prevIndex);
  };

  const handlePlayPause = () => {
    try {
      if (status.playing) {
        player.pause();
      } else {
        if (!status.isLoaded && currentSong?.uri) {
          player.replace(currentSong.uri);
        }
        player.play();
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSeek = (val) => {
    if (typeof val === "number" && !isNaN(val) && val >= 0) {
      try {
        player.seekTo(val);
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleSkipForward10 = () => {
    const current = status.currentTime || 0;
    const dur = status.duration || 0;
    handleSeek(Math.min(dur, current + 10));
  };

  const handleSkipBackward10 = () => {
    const current = status.currentTime || 0;
    handleSeek(Math.max(0, current - 10));
  };

  const handleToggleRepeat = () => {
    if (repeatMode === "off") setRepeatMode("all");
    else if (repeatMode === "all") setRepeatMode("one");
    else setRepeatMode("off");
  };

  const handleChangeSpeed = () => {
    const speeds = [1.0, 1.25, 1.5, 2.0];
    const nextIdx = (speeds.indexOf(playbackSpeed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setPlaybackSpeed(nextSpeed);
    try {
      if (typeof player.setPlaybackRate === "function") {
        player.setPlaybackRate(nextSpeed);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleChangeVolume = (newVol) => {
    setVolume(newVol);
    try {
      player.volume = newVol;
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    if (status.didJustFinish) {
      if (repeatMode === "one") {
        try {
          player.seekTo(0);
          player.play();
        } catch (e) {
          console.warn(e);
        }
      } else if (repeatMode === "all" || isShuffle) {
        handleNext();
      }
    }
  }, [status.didJustFinish]);

  const handleImportAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["audio/*", "audio/mpeg", "audio/mp3", "audio/wav", "audio/x-m4a", "audio/aac", "audio/flac", "audio/ogg"],
        copyToCacheDirectory: false,
        multiple: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const destFolder = `${FileSystem.documentDirectory}songs/`;
      try {
        const dirInfo = await FileSystem.getInfoAsync(destFolder);
        if (!dirInfo.exists) {
          await FileSystem.makeDirectoryAsync(destFolder, { intermediates: true });
        }
      } catch (_) {}

      const imported = [];

      for (let i = 0; i < result.assets.length; i++) {
        const asset = result.assets[i];
        const rawName = asset.name.replace(/\.[^/.]+$/, "");
        let title = rawName;
        let artist = "Música Importada";

        if (rawName.includes(" - ")) {
          const parts = rawName.split(" - ");
          artist = parts[0].trim();
          title = parts.slice(1).join(" - ").trim();
        }

        let targetUri = asset.uri;
        const safeExt = asset.name.includes(".") ? asset.name.split(".").pop() : "mp3";
        const permanentUri = `${destFolder}song_${Date.now()}_${i}.${safeExt}`;

        try {
          await FileSystem.copyAsync({
            from: asset.uri,
            to: permanentUri,
          });
          const check = await FileSystem.getInfoAsync(permanentUri);
          if (check.exists) {
            targetUri = permanentUri;
          }
        } catch (_) {
          targetUri = asset.uri;
        }

        const gradient =
          GRADIENT_PALETTES[(songsList.length + i) % GRADIENT_PALETTES.length];

        imported.push({
          id: `song_${Date.now()}_${i}`,
          title: title || "Faixa de Áudio",
          artist: artist,
          album: "Ficheiros Locais",
          duration: 0,
          artwork: null,
          uri: targetUri,
          isFavorite: false,
          isImported: true,
          gradient: gradient,
        });
      }

      if (imported.length > 0) {
        const updated = [...imported, ...songsList];
        await saveSongs(updated);
        setCurrentIndex(0);

        try {
          player.replace(imported[0].uri);
          player.play();
        } catch (_) {}
      }
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Não foi possível importar as músicas.");
    }
  };

  const handleToggleFavorite = async (id) => {
    const updated = songsList.map((s) =>
      s.id === id ? { ...s, isFavorite: !s.isFavorite } : s
    );
    await saveSongs(updated);
  };

  const handleDeleteSong = (id) => {
    Alert.alert(
      "Remover Música",
      "Tem certeza que deseja apagar esta música?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            const songToDelete = songsList.find((s) => s.id === id);
            if (
              songToDelete?.uri &&
              FileSystem.documentDirectory &&
              songToDelete.uri.startsWith(FileSystem.documentDirectory)
            ) {
              try {
                await FileSystem.deleteAsync(songToDelete.uri, { idempotent: true });
              } catch (_) {}
            }

            const updated = songsList.filter((s) => s.id !== id);
            await saveSongs(updated);

            if (currentSong && currentSong.id === id) {
              if (updated.length > 0) {
                setCurrentIndex(0);
                try {
                  player.replace(updated[0].uri);
                } catch (e) {
                  console.warn(e);
                }
              } else {
                try {
                  player.pause();
                } catch (e) {
                  console.warn(e);
                }
              }
            }
          },
        },
      ]
    );
  };

  // Eliminar mídia na API FastAPI
  const handleDeleteApiMedia = (mediaId) => {
    Alert.alert(
      "Eliminar da API",
      "Deseja eliminar este ficheiro da API e do servidor?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            const res = await deleteMediaItem(mediaId);
            if (res.success) {
              setApiMediaList((prev) => prev.filter((item) => item.id !== mediaId));
              Alert.alert("Sucesso", "Ficheiro eliminado da API.");
            } else {
              Alert.alert("Erro", res.error || "Não foi possível eliminar.");
            }
          },
        },
      ]
    );
  };

  const handleOpenMediaItem = (item) => {
    if (item.type === "audio") {
      handlePlayApiAudio(item);
    } else {
      setSelectedMediaItem(item);
      setIsMediaViewerOpen(true);
    }
  };

  const filteredSongs = useMemo(() => {
    return songsList.filter((song) => {
      const matchesSearch =
        song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (song.album && song.album.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedTab === "favorites") return song.isFavorite;
      return true;
    });
  }, [songsList, searchQuery, selectedTab]);

  const filteredApiMedia = useMemo(() => {
    return apiMediaList.filter((item) => {
      const matchesSearch =
        (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.artist && item.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.type && item.type.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesSearch;
    });
  }, [apiMediaList, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />

      {/* Cabeçalho Principal */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>O Meu Leitor & Media</Text>
          <Text style={styles.headerSubtitle}>
            {activeSection === "local"
              ? `${songsList.length} faixas locais`
              : `${apiMediaList.length} itens no servidor FastAPI`}
          </Text>
        </View>

        <View style={styles.headerButtons}>
          {activeSection === "local" ? (
            <TouchableOpacity
              style={styles.importBtn}
              onPress={handleImportAudio}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#1DB954", "#15803d"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.importBtnGradient}
              >
                <Ionicons name="folder-open" size={16} color="#fff" />
                <Text style={styles.importBtnText}>+ Local</Text>
              </LinearGradient>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.importBtn}
              onPress={() => setIsApiConfigOpen(true)}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#3b82f6", "#1d4ed8"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.importBtnGradient}
              >
                <Ionicons name="cloud-upload" size={16} color="#fff" />
                <Text style={styles.importBtnText}>Upload / URL</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Seletor de Seção Principal: Músicas Locais vs Media da API */}
      <View style={styles.sectionNav}>
        <TouchableOpacity
          style={[styles.sectionNavBtn, activeSection === "local" && styles.sectionNavBtnActive]}
          onPress={() => setActiveSection("local")}
        >
          <Ionicons
            name="musical-notes"
            size={16}
            color={activeSection === "local" ? "#000" : "#9ca3af"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.sectionNavText, activeSection === "local" && styles.sectionNavTextActive]}
          >
            Músicas Locais
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sectionNavBtn, activeSection === "api" && styles.sectionNavBtnActive]}
          onPress={() => setActiveSection("api")}
        >
          <Ionicons
            name="cloud"
            size={16}
            color={activeSection === "api" ? "#000" : "#9ca3af"}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[styles.sectionNavText, activeSection === "api" && styles.sectionNavTextActive]}
          >
            API FastAPI (JSON/Media)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Barra de Pesquisa */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            activeSection === "local"
              ? "Pesquisar músicas ou artistas..."
              : "Pesquisar imagens, áudios, vídeos ou PDFs..."
          }
          placeholderTextColor="#6b7280"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={{ padding: 4 }}>
            <Ionicons name="close-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Filtros da Seção Ativa */}
      {activeSection === "local" ? (
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === "all" && styles.tabActive]}
            onPress={() => setSelectedTab("all")}
          >
            <Text style={[styles.tabText, selectedTab === "all" && styles.tabTextActive]}>
              Todas ({songsList.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tab, selectedTab === "favorites" && styles.tabActive]}
            onPress={() => setSelectedTab("favorites")}
          >
            <Text style={[styles.tabText, selectedTab === "favorites" && styles.tabTextActive]}>
              Favoritas ({songsList.filter((s) => s.isFavorite).length})
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.tabsContainer}>
          {[
            { key: "all", label: "Todas" },
            { key: "image", label: "🖼️ Fotos" },
            { key: "audio", label: "🎵 Áudios" },
            { key: "video", label: "🎬 Vídeos" },
            { key: "pdf", label: "📄 PDFs" },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, apiFilterType === tab.key && styles.tabActive]}
              onPress={() => setApiFilterType(tab.key)}
            >
              <Text style={[styles.tabText, apiFilterType === tab.key && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Conteúdo da Seção Local */}
      {activeSection === "local" && (
        isLoadingStorage ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#1DB954" />
          </View>
        ) : (
          <FlatList
            data={filteredSongs}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="musical-notes-outline" size={56} color="#4b5563" />
                <Text style={styles.emptyTitle}>
                  {songsList.length === 0
                    ? "Nenhuma música adicionada ainda"
                    : "Nenhuma música encontrada"}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {songsList.length === 0
                    ? "Adicione as suas músicas locais para ouvir quando quiser."
                    : "Tente pesquisar com outro termo ou limpe o filtro."}
                </Text>
                <TouchableOpacity
                  style={styles.emptyImportBtn}
                  onPress={handleImportAudio}
                >
                  <Ionicons name="add" size={20} color="#000" style={{ marginRight: 4 }} />
                  <Text style={styles.emptyImportText}>Selecionar Músicas do Aparelho</Text>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => {
              const originalIndex = songsList.findIndex((s) => s.id === item.id);
              const isActive = originalIndex === currentIndex && currentSong != null;

              return (
                <SongItem
                  song={item}
                  active={isActive}
                  isPlaying={status.playing}
                  onPress={() => playSongAt(originalIndex)}
                  onToggleFavorite={handleToggleFavorite}
                  onDelete={handleDeleteSong}
                />
              );
            }}
          />
        )
      )}

      {/* Conteúdo da Seção da API FastAPI */}
      {activeSection === "api" && (
        isLoadingApi ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>A carregar ficheiros da API...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredApiMedia}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isLoadingApi}
                onRefresh={() => loadApiMedia(apiFilterType)}
                tintColor="#3b82f6"
              />
            }
            ListHeaderComponent={
              apiErrorMessage ? (
                <View style={styles.apiErrorBox}>
                  <Ionicons name="alert-circle" size={20} color="#f87171" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.apiErrorText}>Servidor Offline ou Inacessível</Text>
                    <Text style={styles.apiErrorSubtext}>{apiErrorMessage}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => setIsApiConfigOpen(true)}
                    style={styles.apiConfigBtnSmall}
                  >
                    <Text style={styles.apiConfigBtnText}>Configurar</Text>
                  </TouchableOpacity>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="cloud-offline-outline" size={56} color="#4b5563" />
                <Text style={styles.emptyTitle}>Nenhum ficheiro encontrado</Text>
                <Text style={styles.emptySubtitle}>
                  Certifique-se de que a API FastAPI está em execução e faça upload de imagens, áudios, vídeos ou PDFs.
                </Text>
                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    style={[styles.emptyImportBtn, { backgroundColor: "#3b82f6" }]}
                    onPress={() => loadApiMedia(apiFilterType)}
                  >
                    <Ionicons name="refresh" size={18} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={[styles.emptyImportText, { color: "#fff" }]}>Recarregar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.emptyImportBtn, { backgroundColor: "#27272a" }]}
                    onPress={() => setIsApiConfigOpen(true)}
                  >
                    <Ionicons name="settings-outline" size={18} color="#fff" style={{ marginRight: 4 }} />
                    <Text style={[styles.emptyImportText, { color: "#fff" }]}>Configurar API</Text>
                  </TouchableOpacity>
                </View>
              </View>
            }
            renderItem={({ item }) => (
              <MediaItem
                item={item}
                onPress={handleOpenMediaItem}
                onDelete={handleDeleteApiMedia}
              />
            )}
          />
        )
      )}

      {/* MiniPlayer fixo no rodapé quando há música em reprodução */}
      {currentSong && (
        <MiniPlayer
          song={currentSong}
          playing={status.playing}
          currentTime={status.currentTime}
          duration={status.duration}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onToggleFavorite={handleToggleFavorite}
          onPress={() => setIsFullPlayerOpen(true)}
        />
      )}

      {/* Modal do Player de Música Completo */}
      {currentSong && (
        <FullPlayerModal
          visible={isFullPlayerOpen}
          onClose={() => setIsFullPlayerOpen(false)}
          song={currentSong}
          playing={status.playing}
          currentTime={status.currentTime}
          duration={status.duration}
          isShuffle={isShuffle}
          repeatMode={repeatMode}
          playbackSpeed={playbackSpeed}
          volume={volume}
          onPlayPause={handlePlayPause}
          onNext={handleNext}
          onPrev={handlePrev}
          onSeek={handleSeek}
          onSkipForward10={handleSkipForward10}
          onSkipBackward10={handleSkipBackward10}
          onToggleShuffle={() => setIsShuffle((prev) => !prev)}
          onToggleRepeat={handleToggleRepeat}
          onChangeSpeed={handleChangeSpeed}
          onChangeVolume={handleChangeVolume}
          onToggleFavorite={handleToggleFavorite}
        />
      )}

      {/* Modal Visualizador de Fotos, Áudios, Vídeos e PDFs */}
      <MediaViewerModal
        visible={isMediaViewerOpen}
        item={selectedMediaItem}
        onClose={() => setIsMediaViewerOpen(false)}
        onPlayAudio={handlePlayApiAudio}
      />

      {/* Modal de Configuração da URL da API e Upload */}
      <ApiConfigModal
        visible={isApiConfigOpen}
        onClose={() => setIsApiConfigOpen(false)}
        onRefreshData={() => loadApiMedia(apiFilterType)}
      />
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <MainScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 10 : 0,
    paddingBottom: 10,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  importBtn: {
    borderRadius: 20,
    overflow: "hidden",
  },
  importBtnGradient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  importBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  sectionNav: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  sectionNavBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#1f1f23",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  sectionNavBtnActive: {
    backgroundColor: "#ffffff",
  },
  sectionNavText: {
    color: "#9ca3af",
    fontSize: 13,
    fontWeight: "700",
  },
  sectionNavTextActive: {
    color: "#000000",
    fontWeight: "800",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f1f23",
    borderRadius: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: "#ffffff",
    fontSize: 13,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#1f1f23",
  },
  tabActive: {
    backgroundColor: "#ffffff",
  },
  tabText: {
    color: "#9ca3af",
    fontSize: 12,
    fontWeight: "600",
  },
  tabTextActive: {
    color: "#000000",
    fontWeight: "700",
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 110,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    color: "#9ca3af",
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  emptyImportBtn: {
    marginTop: 16,
    backgroundColor: "#1DB954",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
  },
  emptyImportText: {
    color: "#000000",
    fontWeight: "700",
    fontSize: 13,
  },
  apiErrorBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  apiErrorText: {
    color: "#fca5a5",
    fontSize: 13,
    fontWeight: "700",
  },
  apiErrorSubtext: {
    color: "#f87171",
    fontSize: 11,
    marginTop: 2,
  },
  apiConfigBtnSmall: {
    backgroundColor: "#ef4444",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 8,
  },
  apiConfigBtnText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
});