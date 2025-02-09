import os
import json
from groq import Groq
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()
client_groq = Groq(api_key=os.getenv('GROQ_API'))
client = OpenAI(api_key=os.getenv('OPENAI_API'))

def analyze_image(image_url):
    """Analyze an image using OpenAI's Vision API to identify objects and estimate prices.

    Args:
        image_url (str): URL or file path of the image to analyze

    Returns:
        dict: Analysis results containing name, description, and estimated price
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "I want you to analyze the given image and come up with a name for the object in it (such as Bed and Matress, Sofa, Television, etc.). I also want you to come up with a short description of what the item is (such as King Sized Bed, Blue Cloth Sofa, Wide Ceiling Fan, etc.) Also estimate the price of the object in USD. Return the value in the following JSON format {'name': '{name}', 'description': '{description}', 'price': '${price}'}"},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]
        }],
        max_tokens=3000
    )

    content = str(response.choices[0].message.content).strip()
    content = '\n'.join(content.split('\n')[1:-1])
    try:
        result = json.loads(content)
    except json.JSONDecodeError as error:
        raise ValueError(f"Failed to parse JSON from response: {error}\nContent received: {content}")
    return result

def analyze_image_groq(image_url):
    """Analyze an image using OpenAI's Vision API to identify objects and estimate prices.

    Args:
        image_url (str): URL or file path of the image to analyze

    Returns:
        dict: Analysis results containing name, description, and estimated price
    """
    response = client_groq.chat.completions.create(
        model="llama-3.3-70b-specdec",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": "I want you to analyze the given image and come up with a name for the object in it (such as Bed and Matress, Sofa, Television, etc.). I also want you to come up with a short description of what the item is (such as King Sized Bed, Blue Cloth Sofa, Wide Ceiling Fan, etc.) Also estimate the price of the object in USD. Return the value in the following JSON format {'name': '{name}', 'description': '{description}', 'price': '${price}'}"},
                {"type": "image_url", "image_url": {"url": image_url}}
            ]
        }],
        response_format={"type": "json_object"},
        max_tokens=3000
    )

    content = str(response.choices[0].message.content).strip()
    content = '\n'.join(content.split('\n')[1:-1])
    try:
        result = json.loads(content)
    except json.JSONDecodeError as error:
        raise ValueError(f"Failed to parse JSON from response: {error}\nContent received: {content}")
    return result

def analyze_receipt_text(text):
    """Analyze receipt text to extract item details and price.

    Args:
        text (str): The OCR text from the receipt

    Returns:
        dict: Analysis results containing name, description, and price
    """
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[{
            "role": "user",
            "content": f"""Analyze this receipt text and extract the main item purchased, its description, and price.
            Format the response as a JSON with the following fields:
            - name: The main item name
            - description: A description including any relevant details from the receipt
            - price: The price in USD format (e.g. $XX.XX)

            Receipt text:
            {text}"""
        }],
        max_tokens=3000
    )

    content = str(response.choices[0].message.content).strip()
    try:
        result = json.loads(content)
    except json.JSONDecodeError as error:
        raise ValueError(f"Failed to parse JSON from response: {error}\nContent received: {content}")
    return result
