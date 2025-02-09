from flask import request, jsonify
import requests
import base64

@app.route('/proxy-image', methods=['POST'])
def proxy_image():
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
            
        # Fetch the image from Firebase Storage
        response = requests.get(url)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to fetch image'}), response.status_code
            
        # Convert image to base64
        image_base64 = base64.b64encode(response.content).decode('utf-8')
        return jsonify({
            'base64Image': f'data:image/jpeg;base64,{image_base64}'
        })
        
    except Exception as e:
        print('Error in proxy_image:', str(e))
        return jsonify({'error': str(e)}), 500 