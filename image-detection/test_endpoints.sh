#!/bin/bash

# Check if image path and endpoint are provided
if [ $# -ne 2 ]; then
    echo "Usage: $0 <image_path> <endpoint>"
    echo "Endpoint options: detect, analyze"
    exit 1
fi

IMAGE_PATH=$1
ENDPOINT=$2
BASE_URL="http://localhost:4000"

# Validate endpoint
if [ "$ENDPOINT" != "detect" ] && [ "$ENDPOINT" != "analyze" ]; then
    echo "Error: endpoint must be either 'detect' or 'analyze'"
    exit 1
fi

# Check if image file exists
if [ ! -f "$IMAGE_PATH" ]; then
    echo "Error: Image file '$IMAGE_PATH' does not exist"
    exit 1
fi

# Convert image to base64
BASE64_IMAGE=$(base64 -i "$IMAGE_PATH")

# Send POST request with curl
echo "Testing $ENDPOINT endpoint with image: $IMAGE_PATH"
curl -X POST \
     -H "Content-Type: application/json" \
     -H "Accept: application/json" \
     -d "{\"image\": \"data:image/jpeg;base64,$BASE64_IMAGE\"}" \
     "$BASE_URL/$ENDPOINT" \
     | python3 -m json.tool

echo "\nTest completed."