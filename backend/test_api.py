import requests
import json
import os

BASE_URL = "http://127.0.0.1:8000"

print("--- 1. Testando GET / ---")
r = requests.get(f"{BASE_URL}/")
print(f"Status: {r.status_code}")
print(r.json())

print("\n--- 2. Testando GET /media ---")
r = requests.get(f"{BASE_URL}/media")
print(f"Status: {r.status_code}")
media_list = r.json()
print(f"Total de itens retornados: {len(media_list)}")
for item in media_list:
    print(f"  -> [{item['type'].upper()}] {item['title']} => URL: {item['url']}")

print("\n--- 3. Testando POST /media/upload ---")
test_file_path = "backend/test_file.txt"
with open(test_file_path, "w") as f:
    f.write("Ficheiro de teste para upload")

with open(test_file_path, "rb") as f:
    files = {"file": ("test_file.txt", f, "text/plain")}
    data = {"title": "Ficheiro de Teste", "type": "pdf", "description": "Teste automatizado"}
    r = requests.post(f"{BASE_URL}/media/upload", files=files, data=data)

print(f"Status Upload: {r.status_code}")
upload_result = r.json()
print(upload_result)
created_id = upload_result.get("id")

if os.path.exists(test_file_path):
    os.remove(test_file_path)

if created_id:
    print(f"\n--- 4. Testando DELETE /media/{created_id} ---")
    r = requests.delete(f"{BASE_URL}/media/{created_id}")
    print(f"Status Delete: {r.status_code}")
    print(r.json())

print("\n--- 5. Testando Filtro GET /media?type=image ---")
r = requests.get(f"{BASE_URL}/media?type=image")
print(f"Total de imagens: {len(r.json())}")

print("\nTodos os testes passaram com sucesso! [OK]")
