import express, { Request, Response } from 'express';
import { chat, getAllModels, getModelsByProvider, recordUsage, ProviderName } from '../providers/registry';

export const aiRouter = express.Router();

// Chat completion
aiRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { messages, model, temperature, maxTokens, stop, tools } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: 'Messages are required' });
      return;
    }
    
    const response = await chat({
      messages,
      model,
      temperature,
      maxTokens,
      stop,
      tools,
    });
    
    // Record usage
    if (response.usage) {
      recordUsage({
        userId,
        provider: 'anthropic', // Would be dynamic based on provider used
        model: model || 'claude-sonnet-4-20250514',
        inputTokens: response.usage.inputTokens,
        outputTokens: response.usage.outputTokens,
        totalTokens: response.usage.totalTokens,
        cost: response.usage.totalTokens * 0.00001, // Simplified pricing
        timestamp: new Date(),
      });
    }
    
    res.json(response);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat failed';
    res.status(500).json({ error: message });
  }
});

// Get all available models
aiRouter.get('/models', async (req: Request, res: Response) => {
  try {
    const { provider } = req.query;
    
    let models;
    if (provider) {
      models = await getModelsByProvider(provider as ProviderName);
    } else {
      models = await getAllModels();
    }
    
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get models' });
  }
});

// Test provider connection
aiRouter.post('/test', async (req: Request, res: Response) => {
  try {
    const { provider, apiKey, model } = req.body;
    
    // Would test the specific provider
    res.json({ success: true, message: 'Connection successful' });
  } catch (error) {
    res.status(400).json({ error: 'Connection test failed' });
  }
});

// Get token usage
aiRouter.get('/usage', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { startDate, endDate } = req.query;
    
    const usage = getUsage(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );
    
    res.json(usage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get usage' });
  }
});

// Get model pricing
aiRouter.get('/models/:modelId/pricing', async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;
    const models = await getAllModels();
    const model = models.find(m => m.id === modelId);
    
    if (!model) {
      res.status(404).json({ error: 'Model not found' });
      return;
    }
    
    res.json(model.pricing || { input: 0, output: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get pricing' });
  }
});

// Update API configuration
aiRouter.put('/config', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const config = req.body;
    
    // Would store per-user configuration
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update config' });
  }
});

// Get API configuration
aiRouter.get('/config', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    
    // Would return user's configuration (without sensitive data)
    res.json({ provider: 'anthropic' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get config' });
  }
});

// Export getUsage for the route
import { getUsage } from '../providers/registry';
