import requests
import base64
from typing import Optional
from urllib.parse import urlparse

def url_to_base64(image_url: str) -> Optional[str]:
    try:
        # Validate URL format
        result = urlparse(image_url)
        if not all([result.scheme, result.netloc]):
            raise ValueError("Invalid URL format")
            
        # Download the image
        response = requests.get(image_url)
        response.raise_for_status()
        
        # Convert to base64
        image_base64 = base64.b64encode(response.content).decode('utf-8')
        return image_base64
        
    except requests.exceptions.RequestException as e:
        print(f"Error downloading image: {e}")
        return None
    except ValueError as e:
        print(f"Error with URL: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error: {e}")
        return None

# Example usage
if __name__ == "__main__":
    test_url = """https://firebasestorage.googleapis.com/v0/b/insurance-claim-assistant.firebasestorage.app/o/users%2F7BaNEL21a2QA9WIflNICWNlkQrN2%2Fitems%2FJVnXiTrNoY0CQx6kHkR5%2Fimages%2F1737841333244%2Fmain.jpeg?alt=media&token=22e8e6dc-ce0e-4beb-bd89-7a5f9e542450"""
    result = url_to_base64(test_url)
    if result:
        print("Successfully converted image to base64")
        print(result)
    else:
        print("Failed to convert image to base64")
