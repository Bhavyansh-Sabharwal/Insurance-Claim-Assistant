import type { NextApiRequest, NextApiResponse } from 'next';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { image_url } = req.body;

    if (!image_url) {
      return res.status(400).json({ message: 'No image URL provided' });
    }

    // Call the Python script for price analysis
    const pythonScript = path.join(process.cwd(), 'image-detection', 'pricing.py');
    const command = `python3 -c "
import sys
sys.path.append('${path.join(process.cwd(), 'image-detection')}')
from pricing import analyze_image
import json
result = analyze_image('${image_url}')
print(json.dumps(result))
"`;

    const { stdout, stderr } = await execAsync(command);

    if (stderr) {
      console.error('Python script error:', stderr);
      return res.status(500).json({ message: 'Error analyzing price' });
    }

    const result = JSON.parse(stdout.trim());
    res.status(200).json(result);
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
} 