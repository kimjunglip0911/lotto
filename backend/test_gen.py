import requests
import json

url = 'http://127.0.0.1:8000/api/analysis/generate/ai'
print(f"Calling {url}...")
try:
    response = requests.get(url, timeout=120)
    print(f"Status Code: {response.status_code}")
    if response.ok:
        print("Success!")
        print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    else:
        print(f"Error: {response.text}")
except Exception as e:
    print(f"Failed to connect to server: {e}")
