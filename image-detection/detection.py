import json
import requests
from dotenv import load_dotenv
import os
import cv2
import numpy as np
from pathlib import Path

load_dotenv()

def detect_and_crop_objects(image_path):
    image = cv2.imread(image_path)
    height, width = image.shape[:2]
    
    input_filename = Path(image_path).stem
    output_dir = Path(f'/Users/aravdhoot/Insurance-Claim-Assistant/image-detection/crops_{input_filename}')
    output_dir.mkdir(exist_ok=True)
    
    API_KEY = os.getenv('EDEN_API')
    url = 'https://api.edenai.run/v2/image/object_detection'
    data = {'providers': 'api4ai'}
    files = {'file': open(image_path, 'rb')}
    
    response = requests.post(url, data=data, files=files, headers={'Authorization': f'Bearer {API_KEY}'})
    results = json.loads(response.text)['api4ai']['items']
    
    for idx, obj in enumerate(results):
        x_min = int(obj['x_min'] * width)
        x_max = int(obj['x_max'] * width)
        y_min = int(obj['y_min'] * height)
        y_max = int(obj['y_max'] * height)
        
        cropped = image[y_min:y_max, x_min:x_max]
        

        output_path = output_dir / f"{obj['label']}_{idx}.jpg"
        cv2.imwrite(str(output_path), cropped)
        print(f"Saved {output_path}")

image_path = '/Users/aravdhoot/Downloads/bedroom.jpg'
detect_and_crop_objects(image_path)