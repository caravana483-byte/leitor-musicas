import os
import json
import urllib.request

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(BASE_DIR, "uploads", "images")
AUDIOS_DIR = os.path.join(BASE_DIR, "uploads", "audios")
VIDEOS_DIR = os.path.join(BASE_DIR, "uploads", "videos")
PDFS_DIR = os.path.join(BASE_DIR, "uploads", "pdfs")
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_FILE = os.path.join(DATA_DIR, "media.json")

for folder in [IMAGES_DIR, AUDIOS_DIR, VIDEOS_DIR, PDFS_DIR, DATA_DIR]:
    os.makedirs(folder, exist_ok=True)

# Links públicos de amostra pequenos e confiáveis
SAMPLES = {
    "image": {
        "filename": "exemplo_capa.jpg",
        "url": "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=80",
        "title": "Capa Musical Exemplo",
        "dest": IMAGES_DIR,
        "type": "image",
        "artist": "Unsplash",
        "description": "Foto de exemplo para demonstração no app Expo."
    },
    "audio": {
        "filename": "exemplo_musica.mp3",
        "url": "https://raw.githubusercontent.com/rafaelreis-hotmart/Audio-Sample-files/master/sample.mp3",
        "title": "Acoustic Sample",
        "dest": AUDIOS_DIR,
        "type": "audio",
        "artist": "Benjamin Tissot",
        "album": "Demonstração API",
        "description": "Ficheiro MP3 servido pelo backend FastAPI."
    },
    "video": {
        "filename": "exemplo_video.mp4",
        "url": "https://raw.githubusercontent.com/bower-media-samples/big-buck-bunny-480p-30s/master/video.mp4",
        "title": "Vídeo Demonstração",
        "dest": VIDEOS_DIR,
        "type": "video",
        "description": "Vídeo MP4 em alta qualidade para teste de reprodução."
    },
    "pdf": {
        "filename": "exemplo_documento.pdf",
        "url": "https://raw.githubusercontent.com/mozilla/pdf.js/master/examples/learning/helloworld.pdf",
        "title": "Manual e Letra da Música (PDF)",
        "dest": PDFS_DIR,
        "type": "pdf",
        "description": "Ficheiro PDF de demonstração para leitura e download."
    }
}

print("A descarregar ficheiros de exemplo...")

items = []
for key, item in SAMPLES.items():
    file_path = os.path.join(item["dest"], item["filename"])
    subfolder = os.path.basename(item["dest"])
    
    if not os.path.exists(file_path) or os.path.getsize(file_path) == 0:
        try:
            print(f"Descarregando {item['title']}...")
            req = urllib.request.Request(
                item["url"],
                headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
            )
            with urllib.request.urlopen(req, timeout=15) as response, open(file_path, 'wb') as out_file:
                out_file.write(response.read())
            print(f"Salvo em: {file_path}")
        except Exception as e:
            print(f"Erro ao descarregar {item['filename']}: {e}")
            if key == "pdf":
                with open(file_path, "wb") as f:
                    f.write(b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000010 00000 n \n0000000053 00000 n \n0000000102 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF\n")

    size_bytes = os.path.getsize(file_path) if os.path.exists(file_path) else 0

    items.append({
        "id": f"sample_{key}",
        "title": item["title"],
        "type": item["type"],
        "url": f"/uploads/{subfolder}/{item['filename']}",
        "filename": item["filename"],
        "artist": item.get("artist", ""),
        "album": item.get("album", ""),
        "description": item.get("description", ""),
        "size_bytes": size_bytes
    })

with open(DB_FILE, "w", encoding="utf-8") as f:
    json.dump(items, f, indent=2, ensure_ascii=False)

print(f"Configuração concluída com sucesso em {DB_FILE}!")
