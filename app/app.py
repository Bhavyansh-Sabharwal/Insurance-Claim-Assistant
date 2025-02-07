# Import required dependencies
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random
import base64
from werkzeug.utils import secure_filename
from pathlib import Path
from dotenv import load_dotenv
from convert_image import url_to_base64

# Add image-detection directory to Python path
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '../image-detection'))
from detection import detect_and_crop_objects
from pricing import analyze_image

# Load environment variables
load_dotenv()

# Initialize Flask app and enable CORS
app = Flask(__name__)
CORS(app)

# Configure allowed file extensions for image uploads
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    """Check if the uploaded file has an allowed extension.
    
    Args:
        filename (str): Name of the uploaded file
        
    Returns:
        bool: True if file extension is allowed, False otherwise
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def analyze_detected_objects(detected_objects):
    """Analyze detected objects and return their details.
    
    Args:
        detected_objects (list): List of detected objects with base64 image data
        
    Returns:
        list: List of analyzed objects with their details
    """
    analyzed_objects = []
    
    for obj in detected_objects:
        analysis = analyze_image(obj['image_data'])
        
        # Generate random price if not available or invalid
        price = analysis.get('price', 0)
        if not price or price <= 0:
            price = round(random.random() * 500)
        
        analyzed_objects.append({
            'label': obj['label'],
            'confidence': obj['confidence'],
            'image_url': obj['image_data'],
            'name': analysis.get('name', 'Unknown Item'),
            'description': analysis.get('description', 'No description available'),
            'estimated_price': price
        })
    
    return analyzed_objects

@app.route('/detect', methods=['POST'])
def detect_objects():
    """Handle POST requests to detect objects in uploaded images.
    
    This endpoint accepts either:
    1. A file upload with key 'image'
    2. Base64 encoded image data in request.form['image']
    
    Returns:
        JSON: Detection results or error message with appropriate status code
    """
    try:
        image_data = None
        
        # Check if we have a file upload
        if 'image' in request.files:
            file = request.files['image']
            if file.filename == '':
                return jsonify({'error': 'No selected file'}), 400
            if not allowed_file(file.filename):
                return jsonify({'error': 'Invalid file type'}), 400
            image_data = file.read()
        
        # Check if we have base64 encoded image data
        elif 'url' in request.form:
            image_url = request.form['url']
            try:
                image_data = url_to_base64(image_url)
            except Exception as e:
                return jsonify({'error': f'Failed to process image URL: {str(e)}'}), 400    
        
        elif 'image' in request.form:
            encoded_data = request.form['image']
            # Handle data URL format (e.g. data:image/jpeg;base64,/9j/4AAQ...)
            if encoded_data.startswith('data:'):
                encoded_data = encoded_data.split(',')[1]
            try:
                image_data = base64.b64decode(encoded_data)
            except Exception:
                return jsonify({'error': 'Invalid base64 image data'}), 400
        else:
            return jsonify({'error': 'No image data provided'}), 400
        
        # Process the image for object detection
        detected_objects = detect_and_crop_objects(image_data)
        
        # Analyze each detected object
        analyzed_objects = analyze_detected_objects(detected_objects)
        
        # Prepare and return successful response
        response_data = {
            'success': True,
            'detected_objects': analyzed_objects
        }
        print(f"[/detect] Response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        error_response = {'error': str(e)}
        print(f"[/detect] Error: {error_response}")
        return jsonify(error_response), 500

@app.route('/analyze', methods=['POST'])
def analyze_image_endpoint():
    """Handle POST requests to analyze a single image.
    
    This endpoint:
    1. Validates the uploaded image file
    2. Processes it for analysis
    3. Returns the analysis results
    
    Returns:
        JSON: Analysis results or error message with appropriate status code
    """
    # Validate image file presence
    if 'image' not in request.form:
        error_msg = {'error': 'No image file provided'}
        print(f"[/analyze] Error: {error_msg}")
        return jsonify(error_msg), 400
    
    file = request.form['image']
    if file.filename == '':
        error_msg = {'error': 'No selected file'}
        print(f"[/analyze] Error: {error_msg}")
        return jsonify(error_msg), 400
    
    if not allowed_file(file.filename):
        error_msg = {'error': 'Invalid file type'}
        print(f"[/analyze] Error: {error_msg}")
        return jsonify(error_msg), 400
    
    try:
        # Read the image data directly from the request
        image_data = file.read()
        
        # Convert image data to data URL format
        image_base64 = base64.b64encode(image_data).decode('utf-8')
        image_url = f"data:image/jpeg;base64,{image_base64}"
        
        # Analyze the image
        analysis = analyze_image(image_url)
        
        # Prepare and return successful response
        response_data = {
            'success': True,
            'analysis': analysis
        }
        print(f"[/analyze] Response: {response_data}")
        return jsonify(response_data)
        
    except Exception as e:
        error_response = {'error': str(e)}
        print(f"[/analyze] Error: {error_response}")
        return jsonify(error_response), 500

# Start the Flask server if running directly
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)