import express, { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const storageRouter = express.Router();

// Upload file
storageRouter.post('/upload', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;
    
    // For multipart form data, we'd use multer in production
    const { workspaceId, path, content, encoding } = req.body;
    
    const response = await axios.post(
      `${config.services.storage}/storage/upload`,
      { workspaceId, path, content, encoding },
      { headers: { 'x-user-id': userId, 'x-org-id': orgId } }
    );
    
    res.status(201).json(response.data);
  } catch (error) {
    logger.error('Upload failed', error);
    res.status(500).json({ error: 'Failed to upload file' });
  }
});

// Download file
storageRouter.get('/download/:workspaceId/:path(*)', async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId, path } = req.params;
    const userId = req.user?.userId;
    const { encoding } = req.query;
    
    const response = await axios.get(
      `${config.services.storage}/storage/download/${workspaceId}/${path}`,
      {
        params: { encoding },
        headers: { 'x-user-id': userId },
        responseType: 'arraybuffer',
      }
    );
    
    res.set('Content-Type', response.headers['content-type'] || 'application/octet-stream');
    res.send(response.data);
  } catch (error) {
    logger.error('Download failed', error);
    res.status(404).json({ error: 'File not found' });
  }
});

// List workspace files
storageRouter.get('/files/:workspaceId', async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.userId;
    const { path, recursive } = req.query;
    
    const response = await axios.get(
      `${config.services.storage}/storage/files/${workspaceId}`,
      {
        params: { path, recursive },
        headers: { 'x-user-id': userId },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('List files failed', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

// Delete file
storageRouter.delete('/files/:workspaceId/:path(*)', async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId, path } = req.params;
    const userId = req.user?.userId;
    
    await axios.delete(
      `${config.services.storage}/storage/files/${workspaceId}/${path}`,
      { headers: { 'x-user-id': userId } }
    );
    
    res.status(204).send();
  } catch (error) {
    logger.error('Delete failed', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Create workspace
storageRouter.post('/workspaces', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;
    const { name, description, visibility = 'private' } = req.body;
    
    const response = await axios.post(
      `${config.services.storage}/storage/workspaces`,
      { name, description, visibility },
      { headers: { 'x-user-id': userId, 'x-org-id': orgId } }
    );
    
    res.status(201).json(response.data);
  } catch (error) {
    logger.error('Create workspace failed', error);
    res.status(500).json({ error: 'Failed to create workspace' });
  }
});

// List workspaces
storageRouter.get('/workspaces', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;
    
    const response = await axios.get(
      `${config.services.storage}/storage/workspaces`,
      { headers: { 'x-user-id': userId, 'x-org-id': orgId } }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('List workspaces failed', error);
    res.status(500).json({ error: 'Failed to list workspaces' });
  }
});

// Get workspace info
storageRouter.get('/workspaces/:workspaceId', async (req: AuthRequest, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const userId = req.user?.userId;
    
    const response = await axios.get(
      `${config.services.storage}/storage/workspaces/${workspaceId}`,
      { headers: { 'x-user-id': userId } }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get workspace failed', error);
    res.status(404).json({ error: 'Workspace not found' });
  }
});
