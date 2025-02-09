import json
import requests
from dotenv import load_dotenv
import os
import cv2
import numpy as np
from pathlib import Path
import time
import base64

# Load environment variables for API configuration
load_dotenv()

def detect_and_crop_objects(input_data):
    """Detect objects in an image and return cropped objects as base64 encoded images.
    
    This function:
    1. Handles both local files and remote URLs
    2. Uses Eden AI's object detection API to identify objects
    3. Crops detected objects from the original image
    4. Returns detected objects with base64 encoded images
    
    Args:
        input_data (Union[str, bytes]): Image URL, file path, or binary data
        
    Returns:
        list: List of dictionaries containing object label, confidence, and base64 image
    """
    # Convert input_data to bytes if it's a string (likely base64)
    if isinstance(input_data, str):
        if input_data.startswith('data:'):
            # Handle data URL format
            image_data = base64.b64decode(input_data.split(',')[1])
        else:
            # Assume it's a base64 string
            image_data = base64.b64decode(input_data)
    else:
        # Already in bytes format
        image_data = input_data
    
    # Convert to OpenCV format
    nparr = np.frombuffer(image_data, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if image is None:
        raise Exception('Failed to decode image')
    
    height, width = image.shape[:2]
    
    # Configure Eden AI API request
    API_KEY = os.getenv('EDEN_API')
    url = 'https://api.edenai.run/v2/image/object_detection'
    data = {'providers': 'api4ai'}
    files = {'file': ('image.jpg', image_data, 'image/jpeg')}
    
    # Send request to Eden AI for object detection
    response = requests.post(url, data=data, files=files, headers={'Authorization': f'Bearer {API_KEY}'})
    results = json.loads(response.text)['api4ai']['items']
    
    # Process each detected object
    detected_objects = []
    for idx, obj in enumerate(results):
        # Calculate object bounding box coordinates
        x_min = int(obj['x_min'] * width)
        x_max = int(obj['x_max'] * width)
        y_min = int(obj['y_min'] * height)
        y_max = int(obj['y_max'] * height)
        
        # Crop the object from the original image
        cropped = image[y_min:y_max, x_min:x_max]
        
        # Convert cropped image to base64
        _, buffer = cv2.imencode('.jpg', cropped)
        base64_image = base64.b64encode(buffer).decode('utf-8')
        
        # Add object to results
        detected_objects.append({
            'label': obj['label'],
            'confidence': obj.get('confidence', 1.0),
            'image_data': f'data:image/jpeg;base64,{base64_image}'
        })
    
    return detected_objects