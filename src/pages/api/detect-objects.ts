import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Parse the multipart form data
    const form = new formidable.IncomingForm();
    const [fields, files] = await form.parse(req);
    
    if (!files.image || !files.image[0]) {
      return res.status(400).json({ message: 'No image provided' });
    }

    const imagePath = files.image[0].filepath;
    console.log('Received image path:', imagePath);

    // Ensure the image file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(400).json({ message: 'Image file not found' });
    }

    // Get the absolute path to the Python script
    const pythonScript = path.join(process.cwd(), 'image-detection', 'detection.py');
    console.log('Python script path:', pythonScript);

    // Ensure the Python script exists
    if (!fs.existsSync(pythonScript)) {
      return res.status(500).json({ message: 'Detection script not found' });
    }

    // Run the Python script
    console.log('Executing command:', `python3 "${pythonScript}" "${imagePath}"`);
    const { stdout, stderr } = await execAsync(`python3 "${pythonScript}" "${imagePath}"`);

    if (stderr) {
      console.error('Python script error:', stderr);
      return res.status(500).json({ message: 'Error processing image', error: stderr });
    }

    // Get the output directory path (crops_filename)
    const outputDir = path.join(
      process.cwd(),
      'image-detection',
      `crops_${path.basename(imagePath, path.extname(imagePath))}`
    );
    console.log('Looking for output directory:', outputDir);

    // Wait a moment for the file system to catch up
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if output directory exists
    if (!fs.existsSync(outputDir)) {
      console.error('Output directory not found:', outputDir);
      return res.status(500).json({ message: 'No objects detected or output directory not found' });
    }

    // Read the cropped images
    const croppedFiles = fs.readdirSync(outputDir);
    console.log('Found cropped files:', croppedFiles);

    if (croppedFiles.length === 0) {
      return res.status(200).json({ objects: [] });
    }

    const objects = croppedFiles.map((file) => {
      const filePath = path.join(outputDir, file);
      const label = file.split('_')[0];
      
      // Create a data URL from the image file
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString('base64');
      const imageUrl = `data:image/jpeg;base64,${base64Image}`;

      return {
        label,
        confidence: 1.0,
        image_url: imageUrl
      };
    });

    // Clean up temporary files
    try {
      fs.rmSync(outputDir, { recursive: true, force: true });
      fs.rmSync(imagePath);
    } catch (cleanupError) {
      console.error('Error cleaning up files:', cleanupError);
    }

    res.status(200).json({ objects });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ 
      message: 'Internal server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
} 