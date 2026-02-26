import express, { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const browserRouter = express.Router();

// Get browser connection info
browserRouter.get('/connection', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    
    const response = await axios.get(`${config.services.browser}/browser/connection`, {
      headers: { 'x-user-id': userId },
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get browser connection failed', error);
    res.status(500).json({ error: 'Failed to get browser connection' });
  }
});

// Launch browser
browserRouter.post('/launch', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { taskId, headless = true } = req.body;
    
    const response = await axios.post(
      `${config.services.browser}/browser/launch`,
      { taskId, headless },
      { headers: { 'x-user-id': userId } }
    );
    
    res.status(201).json(response.data);
  } catch (error) {
    logger.error('Launch browser failed', error);
    res.status(500).json({ error: 'Failed to launch browser' });
  }
});

// Close browser
browserRouter.delete('/:sessionId', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    
    await axios.delete(`${config.services.browser}/browser/${sessionId}`, {
      headers: { 'x-user-id': userId },
    });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Close browser failed', error);
    res.status(500).json({ error: 'Failed to close browser' });
  }
});

// Take screenshot
browserRouter.get('/:sessionId/screenshot', async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user?.userId;
    
    const response = await axios.get(
      `${config.services.browser}/browser/${sessionId}/screenshot`,
      { headers: { 'x-user-id': userId }, responseType: 'arraybuffer' }
    );
    
    res.set('Content-Type', 'image/png');
    res.send(response.data);
  } catch (error) {
    logger.error('Screenshot failed', error);
    res.status(500).json({ error: 'Failed to take screenshot' });
  }
});
