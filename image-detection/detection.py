import json
import requests
from dotenv import load_dotenv
import os
import cv2
import numpy as np
from pathlib import Path

# Load environment variables for API configuration
load_dotenv()

def detect_and_crop_objects(blob):
    """Detect objects in an image and crop them into individual images.
    
    This function:
    1. Converts the input blob to an OpenCV image
    2. Uses Eden AI's object detection API to identify objects
    3. Crops detected objects from the original image
    4. Saves individual object images
    
    Args:
        blob (bytes): Binary image data to process
        
    Returns:
        Path: Directory containing cropped object images
    """
    # Convert binary blob to OpenCV image format
    nparr = np.frombuffer(blob, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    height, width = image.shape[:2]
    
    # Configure Eden AI API request
    API_KEY = os.getenv('EDEN_API')
    url = 'https://api.edenai.run/v2/image/object_detection'
    data = {'providers': 'api4ai'}
    files = {'file': open(image_path, 'rb')}
    
    # Send request to Eden AI for object detection
    response = requests.post(url, data=data, files=files, headers={'Authorization': f'Bearer {API_KEY}'})
    results = json.loads(response.text)['api4ai']['items']
    
    # Process each detected object
    for idx, obj in enumerate(results):
        # Calculate object bounding box coordinates
        x_min = int(obj['x_min'] * width)
        x_max = int(obj['x_max'] * width)
        y_min = int(obj['y_min'] * height)
        y_max = int(obj['y_max'] * height)
        
        # Crop the object from the original image
        cropped = image[y_min:y_max, x_min:x_max]
        
        # Save the cropped object image
        output_path = output_dir / f"{obj['label']}_{idx}.jpg"
        cv2.imwrite(str(output_path), cropped)
        print(f"Saved {output_path}")

# Example usage with a local image file
image_path = '/Users/aravdhoot/Downloads/bedroom.jpg'
detect_and_crop_objects(image_path)