import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import { DEFAULT_API_URL, API_URL_STORAGE_KEY } from "../config/api";

/**
 * Obtém a URL da API atualmente configurada.
 */
export async function getApiUrl() {
  try {
    const saved = await AsyncStorage.getItem(API_URL_STORAGE_KEY);
    if (saved && saved.trim().length > 0) {
      if (
        (saved.includes("10.0.2.2") && !DEFAULT_API_URL.includes("10.0.2.2")) ||
        saved.includes("172.16.21.90")
      ) {
        return DEFAULT_API_URL;
      }
      return saved.trim().replace(/\/+$/, "");
    }
  } catch (e) {
    console.warn("Erro ao ler URL da API do armazenamento:", e);
  }
  return DEFAULT_API_URL;
}

/**
 * Guarda uma nova URL de API no armazenamento local.
 */
export async function setApiUrl(newUrl) {
  try {
    const cleanUrl = (newUrl || "").trim().replace(/\/+$/, "");
    await AsyncStorage.setItem(API_URL_STORAGE_KEY, cleanUrl);
    return cleanUrl;
  } catch (e) {
    console.warn("Erro ao guardar URL da API:", e);
    return DEFAULT_API_URL;
  }
}

/**
 * Busca a lista de mídias da API Python FastAPI.
 */
export async function fetchMediaList(typeFilter = null) {
  const baseUrl = await getApiUrl();
  let url = `${baseUrl}/media`;
  if (typeFilter && typeFilter !== "all") {
    url += `?type=${typeFilter}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Erro na resposta da API (${response.status})`);
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: error.message || "Não foi possível ligar ao servidor da API.",
      data: [],
    };
  }
}

/**
 * Converte qualquer URI (local, cache ou content://) para Base64 usando FileReader quando suportado.
 */
function readBlobAsBase64(uri) {
  return new Promise((resolve, reject) => {
    fetch(uri)
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao ler URI do ficheiro");
        return res.blob();
      })
      .then((blob) => {
        const reader = new FileReader();
        if (typeof reader.readAsDataURL !== "function") {
          reject(new Error("FileReader.readAsDataURL não suportado"));
          return;
        }
        reader.onloadend = () => {
          const result = reader.result;
          if (typeof result === "string") {
            const base64Clean = result.includes(",") ? result.split(",")[1] : result;
            resolve(base64Clean);
          } else {
            reject(new Error("Resultado do FileReader inválido"));
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsDataURL(blob);
      })
      .catch((err) => reject(err));
  });
}

/**
 * Faz o upload de um ficheiro para a API FastAPI.
 * Prioriza Multipart FormData (nativo, rápido e sem restrições de permissão).
 */
export async function uploadMediaItem({ fileUri, fileName, mimeType, title, type, artist, album, description }) {
  const baseUrl = await getApiUrl();
  const cleanFileName = fileName || "ficheiro_upload";
  const cleanTitle = title || cleanFileName;

  // Método 1: FormData multipart nativo com fetch (método padrão e mais eficiente no React Native)
  try {
    const formData = new FormData();
    formData.append("file", {
      uri: fileUri,
      name: cleanFileName,
      type: mimeType || "application/octet-stream",
    });
    if (cleanTitle) formData.append("title", cleanTitle);
    if (type) formData.append("type", type);
    if (artist) formData.append("artist", artist);
    if (album) formData.append("album", album);
    if (description) formData.append("description", description);

    const response = await fetch(`${baseUrl}/media/upload`, {
      method: "POST",
      body: formData,
      headers: {
        Accept: "application/json",
      },
    });

    if (response.ok) {
      const result = await response.json();
      return { success: true, item: result };
    }

    const errText = await response.text();
    console.warn("Upload via FormData respondeu com erro do servidor:", response.status, errText);
  } catch (formError) {
    console.warn("Falha no upload via FormData, tentando FileSystem.uploadAsync:", formError);
  }

  // Método 2: Fallback via FileSystem.uploadAsync (nativo do Expo)
  try {
    if (FileSystem && typeof FileSystem.uploadAsync === "function") {
      const uploadRes = await FileSystem.uploadAsync(`${baseUrl}/media/upload`, fileUri, {
        fieldName: "file",
        httpMethod: "POST",
        uploadType: FileSystem.FileSystemUploadType.MULTIPART,
        parameters: {
          title: cleanTitle,
          type: type || "",
          artist: artist || "",
          album: album || "",
          description: description || "",
        },
        headers: {
          Accept: "application/json",
        },
      });

      if (uploadRes.status >= 200 && uploadRes.status < 300) {
        const result = JSON.parse(uploadRes.body);
        return { success: true, item: result };
      }
    }
  } catch (fsError) {
    console.warn("Fallback FileSystem.uploadAsync também falhou:", fsError);
  }

  // Método 3: Fallback Base64 para endpoint /media/upload-base64
  try {
    let base64Data = "";
    try {
      base64Data = await readBlobAsBase64(fileUri);
    } catch (_) {
      base64Data = await FileSystem.readAsStringAsync(fileUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
    }

    if (base64Data) {
      const payload = {
        filename: cleanFileName,
        title: cleanTitle,
        type: type || null,
        artist: artist || "",
        album: album || "",
        description: description || "",
        base64_data: base64Data,
      };

      const response = await fetch(`${baseUrl}/media/upload-base64`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        return { success: true, item: result };
      }
    }
  } catch (base64Error) {
    console.warn("Fallback Base64 falhou:", base64Error);
  }

  return {
    success: false,
    error: "Não foi possível transferir o ficheiro. Verifique se o servidor backend está ligado.",
  };
}

/**
 * Elimina um ficheiro de mídia na API pelo ID.
 */
export async function deleteMediaItem(mediaId) {
  const baseUrl = await getApiUrl();
  const endpoint = `${baseUrl}/media/${mediaId}`;

  try {
    const response = await fetch(endpoint, {
      method: "DELETE",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao eliminar (${response.status})`);
    }

    const result = await response.json();
    return { success: true, result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
