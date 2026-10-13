// Configuração da URL da API do Backend Python FastAPI
// 
// NOTA IMPORTANTE PARA DISPOSITIVOS:
// - No Telemóvel Físico via Wi-Fi: use o IP do seu computador (atualmente: http://172.16.23.224:8000)
// - No Emulador Android: use http://10.0.2.2:8000
// - No Simulador iOS: use http://localhost:8000
// - Na Produção / Nuvem (Render, Railway, etc.): use a URL pública (ex: https://sua-api.onrender.com)

export const DEFAULT_API_URL = "https://leitor-musicas.onrender.com";

// Chave para guardar a URL personalizada no AsyncStorage
export const API_URL_STORAGE_KEY = "@api_backend_url";
