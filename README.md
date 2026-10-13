# 🎵 O Meu Leitor de Música (Music Player App)

Aplicação móvel de reprodução de música desenvolvida em **React Native** com o ecossistema **Expo**. O aplicativo foi desenhado para oferecer uma experiência moderna, fluida e intuitiva de reprodução de áudio, com suporte a streaming de faixas remotas, persistência local de dados e importação de ficheiros do dispositivo.

---

## 📌 1. Objetivo do Aplicativo

O objetivo deste projeto é disponibilizar um reprodutor de música portátil, elegante e funcional, permitindo ao utilizador:
* Explorar um catálogo de faixas com capas em alta definição e metadados completos (título, artista, álbum, duração).
* Reproduzir, pausar, avançar/retroceder na linha do tempo (*scrubbing*), e saltar $\pm 10$ segundos.
* Ajustar a velocidade de reprodução ($1.0\times$, $1.25\times$, $1.5\times$, $2.0\times$) e controlar o volume de forma precisa.
* Alternar entre modos de reprodução contínua: **Aleatório (Shuffle)** e **Repetição (Todas / Faixa Atual)**.
* Importar músicas locais do próprio dispositivo (`.mp3`, `.wav`, `.m4a`, etc.) com persistência permanente na memória interna.
* Filtrar faixas por pesquisa em tempo real e organizar músicas favoritas.

---

## 🛠️ 2. Tecnologias Utilizadas

* **Framework Principal:** React Native `0.86.3` / React `19.2.3`
* **Ambiente & Ferramentas:** Expo SDK `57.0.25`
* **Motor de Áudio:** `expo-audio`
* **Gestão de Ficheiros & Persistência:**
  * `expo-file-system` (Armazenamento seguro em `documentDirectory`)
  * `@react-native-async-storage/async-storage` (Base de dados local chave-valor)
  * `expo-document-picker` (Seletor de arquivos do sistema operativo)
* **Interface & Animações:**
  * `expo-image` (Renderização performática de capas)
  * `expo-linear-gradient` (Gradientes dinâmicos)
  * `@react-native-community/slider` (Controlo deslizante de progresso e volume)
  * `react-native-safe-area-context` (Compatibilidade universal com entalhes de ecrã)
  * `@expo/vector-icons` (Iconografia vetorial)

---

## 📦 3. Instalação de Dependências

Para clonar e configurar o ambiente de desenvolvimento local:

```bash
# 1. Instalar as dependências do projeto
npm install
```

---

## 🚀 4. Como Executar Localmente

```bash
# Iniciar o servidor de desenvolvimento Metro com cache limpa
npx expo start -c
```

Opções de visualização:
* Pressione `a` para abrir no emulador Android.
* Pressione `w` para abrir na versão Web.
* Leia o QR Code com o aplicativo **Expo Go** (Android) ou câmara (iOS).

---

## 🌐 5. Como o Áudio é Disponibilizado

O aplicativo utiliza uma estratégia híbrida para garantir que o áudio funcione tanto de forma autónoma (avaliação remota) como com ficheiros locais do utilizador:

1. **Faixas de Demonstração (Acesso Remoto Instantâneo):**
   * As músicas padrão estão alojadas em servidores HTTPS públicos com entrega via CDN de alta velocidade.
   * Não dependem de servidores locais nem do computador do desenvolvedor estar ligado.
2. **Faixas Importadas pelo Utilizador:**
   * Ficheiros selecionados manualmente através do botão `+ Adicionar` são copiados para a pasta segura de documentos do dispositivo (`FileSystem.documentDirectory/songs/`) e indexados no `AsyncStorage`.

---

## 📱 6. Métodos de Acesso e Avaliação para o Docente

Para permitir que o docente avalie o projeto à distância de forma 100% autónoma, estão disponíveis duas opções de entrega:

### Opção A: Ficheiro APK Android (Recomendada — Sem dependência de Expo Go)
Gera um executável `.apk` autónomo que o docente pode descarregar e instalar no telemóvel Android através de um link direto:

1. Fazer login na conta Expo/EAS:
   ```bash
   npx eas-cli login
   ```
2. Gerar a build do APK na nuvem:
   ```bash
   npx eas-cli build -p android --profile preview
   ```
3. O EAS fornecerá um **link público de download do APK** que pode ser enviado diretamente ao docente.

### Opção B: Acesso via Expo Go (Com túnel de rede)
Se o docente possuir o **Expo Go** instalado no smartphone:
```bash
npx expo start --tunnel -c
```
Envie o QR Code ou a URL gerada pelo Expo ao docente.

---


---

## 🐍 8. Backend Python (FastAPI) & Suporte Multimédia

O projeto conta com um backend completo em **Python com FastAPI** na pasta `backend/` para servir metadados num ficheiro JSON (`media.json`) e distribuir ficheiros de **Imagens**, **Áudios**, **Vídeos** e **PDFs**.

### Como Iniciar a API:
```bash
cd backend
pip install -r requirements.txt
python setup_samples.py
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Documentação Swagger:
- **Swagger UI:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Endpoints:**
  - `GET /media` (lista todos os itens ou com filtro `?type=image|audio|video|pdf`)
  - `POST /media/upload` (envio de ficheiros e registro no `media.json`)
  - `DELETE /media/{id}` (eliminação física e no JSON)

Para mais detalhes sobre publicação na Internet (sem localhost), consulte o [backend/README.md](file:///c:/Users/piter/leitor-musicas/backend/README.md).

