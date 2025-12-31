// pages/api/tender/documents/download/[filename].ts
import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { filename } = req.query;

  if (!filename || typeof filename !== 'string') {
    return res.status(400).json({ error: 'Filename is required' });
  }

  try {
    // Construct the full file path based on your backend upload directory structure
    // Adjust this path to match your actual upload directory
    const uploadsBasePath = process.env.UPLOADS_PATH || path.join(process.cwd(), 'uploads');
    const fullPath = path.join(uploadsBasePath, 'tender', 'documents', filename);

    console.log('Looking for file at path:', fullPath);

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log('File not found at path:', fullPath);
      
      // Try alternative paths
      const alternativePaths = [
        path.join(process.cwd(), 'public', 'uploads', 'tender', 'documents', filename),
        path.join(process.cwd(), 'uploads', 'tender', 'documents', filename),
        path.join(process.cwd(), 'tender', 'documents', filename),
      ];

      let foundPath = null;
      for (const altPath of alternativePaths) {
        if (fs.existsSync(altPath)) {
          foundPath = altPath;
          break;
        }
      }

      if (!foundPath) {
        return res.status(404).json({ error: 'File not found' });
      }

      console.log('Found file at alternative path:', foundPath);
      return serveFile(foundPath, filename, res);
    }

    console.log('Serving file from path:', fullPath);
    return serveFile(fullPath, filename, res);
  } catch (error) {
    console.error('Error serving file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function serveFile(filePath: string, filename: string, res: NextApiResponse) {
  try {
    // Get file stats
    const stats = fs.statSync(filePath);
    
    // Set appropriate headers
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.txt': 'text/plain',
      '.zip': 'application/zip',
      '.rar': 'application/x-rar-compressed',
    };

    const mimeType = mimeTypes[ext] || 'application/octet-stream';
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream the file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error in serveFile:', error);
    res.status(500).json({ error: 'Error serving file' });
  }
}