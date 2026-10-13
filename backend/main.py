import os
import json
import uuid
import base64
from typing import Optional, List
from pydantic import BaseModel
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Inicialização da aplicação FastAPI
app = FastAPI(
    title="API de Media - Expo & FastAPI",
    description="Backend simples em Python para guardar e servir Imagens, Áudios, Vídeos e PDFs com metadados em JSON.",
    version="1.0.0"
)

# Configuração de CORS para permitir que a aplicação Expo aceda à API de qualquer origem
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Definição de caminhos base das pastas
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")

IMAGES_DIR = os.path.join(UPLOADS_DIR, "images")
AUDIOS_DIR = os.path.join(UPLOADS_DIR, "audios")
VIDEOS_DIR = os.path.join(UPLOADS_DIR, "videos")
PDFS_DIR = os.path.join(UPLOADS_DIR, "pdfs")

# Garantir que as pastas existem
for folder in [DATA_DIR, IMAGES_DIR, AUDIOS_DIR, VIDEOS_DIR, PDFS_DIR]:
    os.makedirs(folder, exist_ok=True)

DB_FILE = os.path.join(DATA_DIR, "media.json")

# Montar pastas de arquivos estáticos para que possam ser baixados via URL no navegador/app
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")


# --- Funções Auxiliares Simples para o JSON ---

def read_db() -> List[dict]:
    """Lê a lista de ficheiros do ficheiro media.json"""
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def write_db(data: List[dict]):
    """Guarda a lista atualizada no ficheiro media.json"""
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def detect_file_type(filename: str) -> str:
    """Deteta se o ficheiro é image, audio, video ou pdf pela extensão."""
    ext = filename.lower().split(".")[-1]
    if ext in ["jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"]:
        return "image"
    elif ext in ["mp3", "wav", "m4a", "aac", "ogg", "flac"]:
        return "audio"
    elif ext in ["mp4", "mov", "avi", "mkv", "webm"]:
        return "video"
    elif ext in ["pdf"]:
        return "pdf"
    return "other"


def get_target_directory(media_type: str) -> str:
    """Devolve a pasta física de destino de acordo com o tipo."""
    if media_type == "image":
        return IMAGES_DIR
    elif media_type == "audio":
        return AUDIOS_DIR
    elif media_type == "video":
        return VIDEOS_DIR
    elif media_type == "pdf":
        return PDFS_DIR
    return UPLOADS_DIR


def get_base_url(request: Request) -> str:
    """Obtém o URL base correto, respeitando proxies reversos HTTPS (Render, Railway, ngrok)."""
    proto = request.headers.get("x-forwarded-proto")
    host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    if proto and host:
        return f"{proto}://{host}/"
    return str(request.base_url)


def format_media_item(item: dict, base_url: str) -> dict:
    """Garante que o URL retornado contém o caminho completo da API."""
    url = item.get("url", "")
    if url.startswith("http://") or url.startswith("https://"):
        full_url = url
    else:
        # Se for um caminho relativo como /uploads/audios/sample.mp3
        clean_url = url.lstrip("/")
        full_url = f"{base_url}{clean_url}"

    return {
        "id": item.get("id"),
        "title": item.get("title"),
        "type": item.get("type"),
        "url": full_url,
        "relative_url": item.get("url"),
        "filename": item.get("filename"),
        "artist": item.get("artist", ""),
        "album": item.get("album", ""),
        "description": item.get("description", ""),
        "size_bytes": item.get("size_bytes", 0),
        "created_at": item.get("created_at", "")
    }


# --- Rotas da API ---

@app.get("/api", tags=["Info"])
def api_info(request: Request):
    """Informações e estado da API."""
    base_url = get_base_url(request)
    return {
        "status": "online",
        "message": "API de Media Python FastAPI para Expo",
        "docs_swagger": f"{base_url}docs",
        "docs_redoc": f"{base_url}redoc",
        "media_endpoint": f"{base_url}media"
    }


@app.get("/media", tags=["Media"])
def list_media(request: Request, type: Optional[str] = None):
    """
    Lista todos os ficheiros de media registados.
    Pode filtrar por tipo passando ?type=image, audio, video ou pdf.
    """
    base_url = get_base_url(request)
    items = read_db()

    if type:
        items = [i for i in items if i.get("type") == type]

    return [format_media_item(item, base_url) for item in items]


@app.get("/media/{media_id}", tags=["Media"])
def get_media_item(media_id: str, request: Request):
    """Obtém os detalhes de um ficheiro específico por ID."""
    base_url = get_base_url(request)
    items = read_db()
    for item in items:
        if item.get("id") == media_id:
            return format_media_item(item, base_url)
    raise HTTPException(status_code=404, detail="Ficheiro de media não encontrado")


@app.post("/media/upload", tags=["Media"])
async def upload_media(
    request: Request,
    file: UploadFile = File(...),
    title: Optional[str] = Form(None),
    type: Optional[str] = Form(None),
    artist: Optional[str] = Form(""),
    album: Optional[str] = Form(""),
    description: Optional[str] = Form("")
):
    """
    Faz o upload de um ficheiro (imagem, áudio, vídeo ou PDF).
    Guarda o ficheiro na pasta correspondente e regista os dados no media.json.
    """
    filename = file.filename or "file"
    detected_type = detect_file_type(filename)
    final_type = type if type in ["image", "audio", "video", "pdf"] else detected_type

    # Gera um nome de ficheiro único para evitar substituições acidentais
    item_id = str(uuid.uuid4())[:8]
    ext = os.path.splitext(filename)[1]
    safe_filename = f"{item_id}_{filename.replace(' ', '_')}"

    # Escolhe a pasta correta
    target_dir = get_target_directory(final_type)
    file_path = os.path.join(target_dir, safe_filename)

    # Guarda o ficheiro no disco
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    # Subpasta relativa para o URL
    subfolder_map = {
        "image": "images",
        "audio": "audios",
        "video": "videos",
        "pdf": "pdfs"
    }
    subfolder = subfolder_map.get(final_type, "")
    relative_url = f"/uploads/{subfolder}/{safe_filename}" if subfolder else f"/uploads/{safe_filename}"

    # Se não foi fornecido título, usa o nome do ficheiro sem extensão
    item_title = title if title else os.path.splitext(filename)[0]

    new_item = {
        "id": item_id,
        "title": item_title,
        "type": final_type,
        "url": relative_url,
        "filename": safe_filename,
        "artist": artist or ("Artista Local" if final_type == "audio" else ""),
        "album": album or ("Ficheiros do Servidor" if final_type == "audio" else ""),
        "description": description or "",
        "size_bytes": len(content),
    }

    # Atualiza o ficheiro JSON
    items = read_db()
    items.insert(0, new_item)
    write_db(items)

    base_url = get_base_url(request)
    return format_media_item(new_item, base_url)


class Base64UploadSchema(BaseModel):
    filename: str
    title: Optional[str] = None
    type: Optional[str] = None
    artist: Optional[str] = ""
    album: Optional[str] = ""
    description: Optional[str] = ""
    base64_data: str


@app.post("/media/upload-base64", tags=["Media"])
async def upload_media_base64(payload: Base64UploadSchema, request: Request):
    """
    Upload de ficheiros via Base64 (100% compatível com mobile e sem restrições de permissão).
    """
    filename = payload.filename or "file"
    detected_type = detect_file_type(filename)
    final_type = payload.type if payload.type in ["image", "audio", "video", "pdf"] else detected_type

    item_id = str(uuid.uuid4())[:8]
    safe_filename = f"{item_id}_{filename.replace(' ', '_')}"

    target_dir = get_target_directory(final_type)
    file_path = os.path.join(target_dir, safe_filename)

    # Decodificar Base64
    raw_b64 = payload.base64_data
    if "," in raw_b64:
        raw_b64 = raw_b64.split(",", 1)[1]
    content = base64.b64decode(raw_b64)

    with open(file_path, "wb") as f:
        f.write(content)

    subfolder_map = {
        "image": "images",
        "audio": "audios",
        "video": "videos",
        "pdf": "pdfs"
    }
    subfolder = subfolder_map.get(final_type, "")
    relative_url = f"/uploads/{subfolder}/{safe_filename}" if subfolder else f"/uploads/{safe_filename}"

    item_title = payload.title if payload.title else os.path.splitext(filename)[0]

    new_item = {
        "id": item_id,
        "title": item_title,
        "type": final_type,
        "url": relative_url,
        "filename": safe_filename,
        "artist": payload.artist or ("Artista Local" if final_type == "audio" else ""),
        "album": payload.album or ("Ficheiros do Servidor" if final_type == "audio" else ""),
        "description": payload.description or "",
        "size_bytes": len(content),
    }

    items = read_db()
    items.insert(0, new_item)
    write_db(items)

    base_url = get_base_url(request)
    return format_media_item(new_item, base_url)



@app.delete("/media/{media_id}", tags=["Media"])
def delete_media(media_id: str):
    """
    Elimina um ficheiro de media pelo seu ID (remove do JSON e do disco).
    """
    items = read_db()
    item_to_delete = None
    remaining_items = []

    for item in items:
        if item.get("id") == media_id:
            item_to_delete = item
        else:
            remaining_items.append(item)

    if not item_to_delete:
        raise HTTPException(status_code=404, detail="Ficheiro de media não encontrado")

    # Tenta remover o ficheiro físico do disco
    filename = item_to_delete.get("filename")
    media_type = item_to_delete.get("type", "")
    if filename:
        target_dir = get_target_directory(media_type)
        physical_path = os.path.join(target_dir, filename)
        if os.path.exists(physical_path):
            try:
                os.remove(physical_path)
            except Exception as e:
                print(f"Erro ao remover ficheiro do disco: {e}")

    # Atualiza o JSON
    write_db(remaining_items)

    return {
        "success": True,
        "message": f"Item '{item_to_delete.get('title')}' eliminado com sucesso.",
        "id": media_id
    }


# Monta a aplicação web (Expo Web) para acesso direto pelo navegador na raiz (/)
WEB_APP_DIR = os.path.join(BASE_DIR, "web_app")
if os.path.exists(WEB_APP_DIR):
    app.mount("/", StaticFiles(directory=WEB_APP_DIR, html=True), name="web_app")

