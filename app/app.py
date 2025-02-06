from flask import Flask, request, jsonify
from flask_cors import CORS
from detection import detect_and_crop_objects
import os
from werkzeug.utils import secure_filename
from pathlib import Path

app = Flask(__name__)
CORS(app)

# Configure upload folder
UPLOAD_FOLDER = Path('/Users/aravdhoot/Insurance-Claim-Assistant/image-detection/uploads')
UPLOAD_FOLDER.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

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
        
        # Get the list of cropped images
        crops_dir = Path(output_dir)
        cropped_images = [{
            'label': f.stem.split('_')[0],
            'path': str(f.relative_to(app.root_path))
        } for f in crops_dir.glob('*.jpg')]
        
        # Clean up the uploaded file
        os.remove(filepath)
        
        return jsonify({
            'success': True,
            'detected_objects': cropped_images
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=4000, debug=True)