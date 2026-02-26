import express, { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const aiRouter = express.Router();

// Get available models
aiRouter.get('/models', async (req: AuthRequest, res: Response) => {
  try {
    const { provider } = req.query;
    
    const response = await axios.get(`${config.services.ai}/ai/models`, {
      params: { provider },
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get models failed', error);
    res.status(500).json({ error: 'Failed to get models' });
  }
});

// Get model pricing
aiRouter.get('/models/:modelId/pricing', async (req: AuthRequest, res: Response) => {
  try {
    const { modelId } = req.params;
    
    const response = await axios.get(
      `${config.services.ai}/ai/models/${modelId}/pricing`
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get pricing failed', error);
    res.status(404).json({ error: 'Model not found' });
  }
});

// Update API configuration
aiRouter.put('/config', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;
    const config = req.body;
    
    const response = await axios.put(
      `${config.services.ai}/ai/config`,
      config,
      {
        headers: {
          'x-user-id': userId,
          'x-org-id': orgId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Update config failed', error);
    res.status(500).json({ error: 'Failed to update configuration' });
  }
});

// Get API configuration
aiRouter.get('/config', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;
    
    const response = await axios.get(`${config.services.ai}/ai/config`, {
      headers: {
        'x-user-id': userId,
        'x-org-id': orgId,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get config failed', error);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// Test API connection
aiRouter.post('/test', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { provider, apiKey, model } = req.body;
    
    const response = await axios.post(
      `${config.services.ai}/ai/test`,
      { provider, apiKey, model },
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Test connection failed', error);
    res.status(400).json({ error: 'Connection test failed' });
  }
});

// Get token usage
aiRouter.get('/usage', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;
    const { startDate, endDate } = req.query;
    
    const response = await axios.get(`${config.services.ai}/ai/usage`, {
      params: { startDate, endDate },
      headers: {
        'x-user-id': userId,
        'x-org-id': orgId,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get usage failed', error);
    res.status(500).json({ error: 'Failed to get usage' });
  }
});
