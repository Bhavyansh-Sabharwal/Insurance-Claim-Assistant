import os
import json
import requests
from dotenv import load_dotenv
from pricing import analyze_receipt_text

load_dotenv()
api_key = os.getenv('EDEN_API')

def read_ocr(image_url):
    """Process a receipt image through OCR and analyze its contents.
    
    Args:
        image_url (str): URL of the receipt image
        
    Returns:
        dict: Contains OCR text and analyzed receipt data
    """
    if not api_key:
        raise ValueError("EDEN_API environment variable is not set")

    headers = {"Authorization": f"Bearer {api_key}"}

    url = "https://api.edenai.run/v2/ocr/ocr"
    json_payload = {
        "providers": "google",
        "language": "en",
        "file_url": image_url,
    }

    try:
        response = requests.post(url, json=json_payload, headers=headers)
        response.raise_for_status()
        result = response.json()
        
        if "google" not in result or "text" not in result["google"]:
            raise ValueError(f"Unexpected API response format: {result}")
            
        ocr_text = result["google"]["text"]
        
        # Analyze the receipt text to extract item details
        analyzed_data = analyze_receipt_text(ocr_text)
        
        return {
            "text": ocr_text,
            "analyzed_data": analyzed_data,
            "image_url": image_url
        }
    except requests.exceptions.RequestException as e:
        print(f"Error calling Eden AI API: {e}")
        raise
    except (KeyError, json.JSONDecodeError, ValueError) as e:
        print(f"Error processing API response: {e}")
        raise