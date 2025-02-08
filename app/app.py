# Import required dependencies
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import random
import base64
from dotenv import load_dotenv
from convert_image import url_to_base64
import json

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
        print(f"OBJ ++++++++++++++++++++++++++ \n {obj} ")
        try:
            analysis = analyze_image(obj['image_data'])
            
            # Extract price value, removing '$' if present
            price_str = analysis.get('price', '$0').replace('$', '').replace(',', '')
            try:
                price = float(price_str)
            except (ValueError, TypeError):
                price = round(random.uniform(100, 500), 2)

            analyzed_objects.append({
                'label': obj['label'],
                'confidence': obj['confidence'],
                'image_url': obj['image_data'],
                'name': analysis.get('name', obj['label'].capitalize()),
                'description': analysis.get('description', f'A {obj["label"]}'),
                'estimated_price': f'${price:.2f}'
            })
        except Exception as e:
            print(f"Error analyzing object: {str(e)}")
            # Add a fallback object if analysis fails
            analyzed_objects.append({
                'label': obj['label'],
                'confidence': obj['confidence'],
                'image_url': obj['image_data'],
                'name': obj['label'].capitalize(),
                'description': f'A {obj["label"]}',
                'estimated_price': f'${round(random.uniform(100, 500), 2):.2f}'
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
        json_s = request.get_json()
        print(json_s)

        image_url = json_s['url']
        image_data = url_to_base64(image_url)

        # Process the image for object detection
        print("HERE")
        detected_objects = detect_and_crop_objects(image_data)
        print("Detected objects:", json.dumps(detected_objects)[:200])  # Print first 200 chars to avoid flooding logs
        analyzed_objects = analyze_detected_objects(detected_objects)
        print("HERE3")

        # Prepare and return successful response
        response_data = {
            'success': True,
            'detected_objects': analyzed_objects
        }
        print(f"[/detect] Response: {response_data}")
        return jsonify(response_data)

    except Exception as e:
        error_response = {'error': str(e)[:100]}
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

# For Vercel deployment
app = app

# Configure base URL for API endpoints
if os.environ.get('VERCEL_ENV'):
    BASE_URL = '/api'
else:
    BASE_URL = ''

# Update route paths for Vercel deployment
app.url_map.strict_slashes = False
app.config['APPLICATION_ROOT'] = BASE_URL
