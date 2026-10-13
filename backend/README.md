# 🚀 Backend em Python com FastAPI para a Aplicação Expo

Este backend disponibiliza uma API simples e rápida para servir ficheiros multimédia (**Imagens**, **Áudios**, **Vídeos** e **PDFs**) e os seus metadados guardados num ficheiro JSON (`data/media.json`).

---

## 📁 Estrutura de Pastas do Backend

```text
backend/
├── data/
│   └── media.json             # Base de dados em formato JSON (metadados)
├── uploads/
│   ├── images/                # Guarda ficheiros de imagem (.jpg, .png, etc.)
│   ├── audios/                # Guarda ficheiros de áudio (.mp3, .wav, etc.)
│   ├── videos/                # Guarda ficheiros de vídeo (.mp4, etc.)
│   └── pdfs/                  # Guarda ficheiros de documentos (.pdf)
├── main.py                    # Servidor FastAPI com rotas CRUD e CORS
├── requirements.txt           # Dependências Python (FastAPI, Uvicorn, multipart)
├── setup_samples.py           # Script para inicializar ficheiros de exemplo
└── README.md                  # Este guia
```

---

## 🛠️ Como Executar o Backend Localmente

### 1. Instalar as dependências
Abra o terminal na pasta `backend` e execute:

```bash
pip install -r requirements.txt
```

### 2. (Opcional) Descarregar/Inicializar os ficheiros de exemplo
```bash
python setup_samples.py
```

### 3. Iniciar o servidor FastAPI
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
> **Nota:** Usamos `--host 0.0.0.0` para que qualquer telemóvel conectado na mesma rede Wi-Fi consiga aceder ao backend através do IP do seu computador (ex: `http://192.168.1.100:8000`).

---

## 📖 Testar a API no Navegador (Documentação Swagger)

Após iniciar o servidor, abra no navegador:
- **Swagger UI interativa:** [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc:** [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **Lista de media (JSON):** [http://localhost:8000/media](http://localhost:8000/media)

---

## 🌐 Endpoints Disponíveis

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/` | Estado da API e boas-vindas |
| `GET` | `/media` | Lista todos os ficheiros (ou filtra com `?type=audio`, `image`, `video`, `pdf`) |
| `GET` | `/media/{id}` | Obtém os detalhes de um ficheiro específico |
| `POST` | `/media/upload` | Envia um ficheiro e grava no `media.json` |
| `DELETE` | `/media/{id}` | Elimina o ficheiro do disco e remove do `media.json` |
| `GET` | `/uploads/{pasta}/{ficheiro}` | Acesso direto ao ficheiro estático |

---

## ☁️ Como Publicar a API na Internet (Gratuito e sem Localhost)

Para que a sua aplicação Expo publicada funcione em qualquer parte do mundo sem depender do `localhost` do seu computador, deve publicar esta pasta `backend` num serviço de alojamento gratuito na nuvem:

### Opção 1: Publicar no **Render** (Recomendado e Gratuito)
1. Crie uma conta gratuita em [render.com](https://render.com).
2. Conecte o seu repositório GitHub.
3. Crie um novo **Web Service**.
4. Defina:
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt && python setup_samples.py`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. O Render irá gerar um URL público seguro com HTTPS (ex: `https://minha-api-musicas.onrender.com`).
6. Basta colar esse URL no ficheiro de configuração da sua app Expo: `src/config/api.js`.

### Opção 2: Publicar no **Railway**
1. Acesse [railway.app](https://railway.app) e faça login com o GitHub.
2. Crie um **New Project** -> **Deploy from GitHub repo**.
3. Defina a pasta raiz como `backend`.
4. O Railway deteta automaticamente o `requirements.txt` e inicia o FastAPI.
5. Copie o domínio gerado (ex: `https://meu-app.up.railway.app`) e coloque no app Expo.

### Opção 3: Testar Imediatamente na Internet via **ngrok** (sem publicar ainda)
Se quiser testar a API no seu telemóvel físico agora mesmo antes de fazer deploy na nuvem:
```bash
npx ngrok http 8000
```
Ele gerará um link público seguro (ex: `https://a1b2-c3d4.ngrok-free.app`). Cole-o no `src/config/api.js`.
