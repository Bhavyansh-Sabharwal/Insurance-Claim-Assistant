# Import required dependencies
from flask import Flask, request, jsonify
from flask_cors import CORS
from detection import detect_and_crop_objects
from pricing import analyze_image
import os
import random
from werkzeug.utils import secure_filename
from pathlib import Path
from dotenv import load_dotenv

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

def analyze_detected_objects(output_dir, app_root_path):
    """Analyze detected objects in the output directory and return their details.
    
    Args:
        output_dir (Path): Directory containing cropped object images
        app_root_path (str): Root path of the Flask application
        
    Returns:
        list: List of analyzed objects with their details
    """
    analyzed_objects = []
    crops_dir = Path(output_dir)
    
    for f in crops_dir.glob('*.jpg'):
        image_url = f"file://{f.absolute()}"
        analysis = analyze_image(image_url)
        
        # Generate random price if not available or invalid
        price = analysis.get('price', 0)
        if not price or price <= 0:
            price = round(random.random() * 500)
        
        analyzed_objects.append({
            'label': f.stem.split('_')[0],
            'path': str(f.relative_to(app_root_path)),
            'name': analysis.get('name', 'Unknown Item'),
            'description': analysis.get('description', 'No description available'),
            'estimated_price': price
        })
    
    return analyzed_objects

@app.route('/detect', methods=['POST'])
def detect_objects():
    """Handle POST requests to detect objects in uploaded images.
    
    This endpoint:
    1. Validates the uploaded image file
    2. Saves it temporarily
    3. Processes it for object detection
    4. Analyzes detected objects
    5. Returns the analysis results
    
    Returns:
        JSON: Detection results or error message with appropriate status code
    """
    # Validate image file presence
    if 'image' not in request.files:
        error_msg = {'error': 'No image file provided'}
        print(f"[/detect] Error: {error_msg}")
        return jsonify(error_msg), 400
    
    file = request.files['image']
    if file.filename == '':
        error_msg = {'error': 'No selected file'}
        print(f"[/detect] Error: {error_msg}")
        return jsonify(error_msg), 400
    
    if not allowed_file(file.filename):
        error_msg = {'error': 'Invalid file type'}
        print(f"[/detect] Error: {error_msg}")
        return jsonify(error_msg), 400
    
    try:
        # Save the uploaded file temporarily
        filename = secure_filename(file.filename)
        file.save(str(filepath))
        
        # Process the image for object detection
        output_dir = detect_and_crop_objects(str(filepath))
        
        # Analyze each detected object
        analyzed_objects = analyze_detected_objects(output_dir, app.root_path)
        
        # Clean up temporary file
        os.remove(filepath)
        
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
    if 'image' not in request.files:
        error_msg = {'error': 'No image file provided'}
        print(f"[/analyze] Error: {error_msg}")
        return jsonify(error_msg), 400
    
    file = request.files['image']
    if file.filename == '':
        error_msg = {'error': 'No selected file'}
        print(f"[/analyze] Error: {error_msg}")
        return jsonify(error_msg), 400
    
    if not allowed_file(file.filename):
        error_msg = {'error': 'Invalid file type'}
        print(f"[/analyze] Error: {error_msg}")
        return jsonify(error_msg), 400
    
    try:
        # Save the uploaded file
        filename = secure_filename(file.filename)
    
        # Analyze the image
        image_url = f"file://{filepath}"
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