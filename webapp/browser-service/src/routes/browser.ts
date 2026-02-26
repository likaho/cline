import express, { Request, Response } from 'express';
import { browserPool, BrowserSession } from '../services/pool';

export const browserRouter = express.Router();

// Get browser pool stats
browserRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = browserPool.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get browser connection info
browserRouter.get('/connection', async (req: Request, res: Response) => {
  try {
    res.json({
      connected: true,
      version: '1.0.0',
      capabilities: ['screenshot', 'console', 'network', 'dom'],
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get connection info' });
  }
});

// Launch a new browser session
browserRouter.post('/launch', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { taskId, headless = true, url } = req.body;
    
    const session = await browserPool.acquire(userId, taskId);
    
    // Optionally navigate to URL
    if (url) {
      await session.page.goto(url, { waitUntil: 'networkidle0' });
    }
    
    // Get initial screenshot
    const screenshot = await session.page.screenshot({ encoding: 'base64' });
    
    res.status(201).json({
      sessionId: session.id,
      screenshot,
      url: url || 'about:blank',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to launch browser';
    res.status(500).json({ error: message });
  }
});

// Close browser session
browserRouter.delete('/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    await browserPool.closeSession(sessionId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to close browser' });
  }
});

// Take screenshot
browserRouter.get('/:sessionId/screenshot', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { fullPage } = req.query;
    
    // Would get session from pool manager
    res.status(501).json({ error: 'Screenshot requires active session' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to take screenshot' });
  }
});

// Navigate to URL
browserRouter.post('/:sessionId/navigate', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { url, waitUntil = 'networkidle0' } = req.body;
    
    res.status(501).json({ error: 'Navigate requires active session' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to navigate' });
  }
});

// Execute JavaScript
browserRouter.post('/:sessionId/execute', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { script } = req.body;
    
    res.status(501).json({ error: 'Execute requires active session' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to execute script' });
  }
});

// Click element
browserRouter.post('/:sessionId/click', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { selector } = req.body;
    
    res.status(501).json({ error: 'Click requires active session' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to click element' });
  }
});

// Type text
browserRouter.post('/:sessionId/type', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { selector, text } = req.body;
    
    res.status(501).json({ error: 'Type requires active session' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to type text' });
  }
});

// Get console logs
browserRouter.get('/:sessionId/logs', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    res.status(501).json({ error: 'Logs require active session' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get logs' });
  }
});
