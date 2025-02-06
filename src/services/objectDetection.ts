import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface DetectedObject {
  label: string;
  confidence: number;
  imageUrl: string;
}

export const getImageDetection = async (file: File): Promise<DetectedObject[]> => {
  // Initialize TensorFlow.js with WebGL backend
  await tf.setBackend('webgl');
  await tf.ready();

  // Load the COCO-SSD model
  const model = await cocoSsd.load({
    base: 'lite_mobilenet_v2'  // Use a lighter model for better performance
  });

  // Create an HTMLImageElement from the file
  const imageUrl = URL.createObjectURL(file);
  const img = new Image();
  img.src = imageUrl;
  await new Promise((resolve) => {
    img.onload = resolve;
  });

  // Create a tensor from the image
  const imageTensor = tf.browser.fromPixels(img);
  
  // Run detection
  const predictions = await model.detect(imageTensor);

  // Dispose the tensor to free memory
  imageTensor.dispose();

  // Create a canvas to extract individual object images
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = img.width;
  canvas.height = img.height;
  ctx.drawImage(img, 0, 0);

  // Process each detected object
  const detectedObjects: DetectedObject[] = await Promise.all(
    predictions.map(async (prediction) => {
      const [x, y, width, height] = prediction.bbox;
      
      // Create a new canvas for this object
      const objectCanvas = document.createElement('canvas');
      const objectCtx = objectCanvas.getContext('2d');
      if (!objectCtx) throw new Error('Could not get object canvas context');

      // Set canvas size to the bounding box
      objectCanvas.width = width;
      objectCanvas.height = height;

      // Draw the cropped image
      objectCtx.drawImage(
        img,
        x, y, width, height,
        0, 0, width, height
      );

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        objectCanvas.toBlob((blob) => {
          if (blob) resolve(blob);
        }, 'image/jpeg', 0.95);  // Higher quality JPEG
      });

      return {
        label: prediction.class,
        confidence: prediction.score,
        imageUrl: URL.createObjectURL(blob)
      };
    })
  );

  // Clean up
  URL.revokeObjectURL(imageUrl);

  return detectedObjects;
}; 