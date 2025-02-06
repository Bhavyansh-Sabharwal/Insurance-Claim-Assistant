interface ProductRecognitionResult {
  label: string;
  imageUrl: string;
  confidence: number;
  metadata?: {
    brand?: string;
    title?: string;
    gtins?: string[];
  };
}

export const detectProducts = async (imageFile: File): Promise<ProductRecognitionResult[]> => {
  try {
    // Convert the image file to base64
    const base64Image = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64.split(',')[1]); // Remove the data URL prefix
      };
      reader.readAsDataURL(imageFile);
    });

    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      throw new Error('Google Vision API key not found in environment variables');
    }

    const apiUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'OBJECT_LOCALIZATION',
              maxResults: 10
            },
            {
              type: 'LABEL_DETECTION',
              maxResults: 10
            },
            {
              type: 'LOGO_DETECTION',
              maxResults: 10
            }
          ]
        }
      ]
    };

    // Make the API call
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Vision AI Error Response:', errorData);
      throw new Error(`Google Vision AI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Google Vision AI Response:', data);

    // Transform the response into our expected format
    const products: ProductRecognitionResult[] = [];

    if (data.responses?.[0]) {
      const response = data.responses[0];
      
      // Handle object detection results
      if (response.localizedObjectAnnotations) {
        response.localizedObjectAnnotations.forEach((object: any) => {
          products.push({
            label: object.name,
            imageUrl: URL.createObjectURL(imageFile),
            confidence: object.score,
            metadata: {
              title: object.name
            }
          });
        });
      }

      // Add label detection results
      if (response.labelAnnotations) {
        response.labelAnnotations.forEach((label: any) => {
          if (label.score > 0.7) { // Only include high confidence labels
            products.push({
              label: label.description,
              imageUrl: URL.createObjectURL(imageFile),
              confidence: label.score,
              metadata: {
                title: label.description
              }
            });
          }
        });
      }

      // Add logo detection results
      if (response.logoAnnotations) {
        response.logoAnnotations.forEach((logo: any) => {
          products.push({
            label: logo.description,
            imageUrl: URL.createObjectURL(imageFile),
            confidence: logo.score,
            metadata: {
              brand: logo.description,
              title: `${logo.description} Logo`
            }
          });
        });
      }
    }

    return products;
  } catch (error) {
    console.error('Error in Google Vision AI product detection:', error);
    throw error;
  }
}; 