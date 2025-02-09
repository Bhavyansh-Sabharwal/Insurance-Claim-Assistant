import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
api_key=os.getenv('OPENAI_API')

def read_ocr(image_url):
    headers = {f"Authorization": "Bearer {api_key}"}

    url = "https://api.edenai.run/v2/ocr/ocr"
    json_payload = {
        "providers": "google",
        "language": "en",
        "file_url": image_url,
    }

    response = requests.post(url, json=json_payload, headers=headers)

    result = json.loads(response.text)
    print(result["google"]["text"])

    return result["google"]["text"]