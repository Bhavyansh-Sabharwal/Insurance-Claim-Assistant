from flask import Flask, request, jsonify
from flask_cors import CORS
from detection import detect_and_crop_objects
from pricing import analyze_image
import os
from werkzeug.utils import secure_filename
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = Path('/Users/aravdhoot/Insurance-Claim-Assistant/image-detection/uploads')
UPLOAD_FOLDER.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
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
        analyzed_objects.append({
            'label': f.stem.split('_')[0],
            'path': str(f.relative_to(app_root_path)),
            'name': analysis['name'],
            'description': analysis['description'],
            'estimated_price': analysis['price']
        })
    
    return analyzed_objects

@app.route('/detect', methods=['POST'])
def detect_objects():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = UPLOAD_FOLDER / filename
        file.save(str(filepath))
        
        # Process the image
        output_dir = detect_and_crop_objects(str(filepath))
        
        # Analyze the detected objects
        analyzed_objects = analyze_detected_objects(output_dir, app.root_path)
        
        # Clean up the uploaded file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'detected_objects': analyzed_objects
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/analyze', methods=['POST'])
def analyze_image_endpoint():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file provided'}), 400
    
    file = request.files['image']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    
    if not allowed_file(file.filename):
        return jsonify({'error': 'Invalid file type'}), 400
    
    try:
        # Save the uploaded file
        filename = secure_filename(file.filename)
        filepath = UPLOAD_FOLDER / filename
        file.save(str(filepath))
        
        # Analyze the image
        image_url = f"file://{filepath}"
        analysis = analyze_image(image_url)
        
        # Clean up the uploaded file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'analysis': analysis
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)