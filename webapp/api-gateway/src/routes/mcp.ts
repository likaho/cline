import express, { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const mcpRouter = express.Router();

// List available MCP servers
mcpRouter.get('/servers', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;
    
    const response = await axios.get(`${config.services.mcp}/mcp/servers`, {
      headers: { 'x-user-id': userId, 'x-org-id': orgId },
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('List MCP servers failed', error);
    res.status(500).json({ error: 'Failed to list MCP servers' });
  }
});

// Get MCP marketplace
mcpRouter.get('/marketplace', async (req: AuthRequest, res: Response) => {
  try {
    const { category, search } = req.query;
    
    const response = await axios.get(`${config.services.mcp}/mcp/marketplace`, {
      params: { category, search },
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get marketplace failed', error);
    res.status(500).json({ error: 'Failed to get marketplace' });
  }
});

// Add MCP server
mcpRouter.post('/servers', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;
    const { name, type, config: serverConfig } = req.body;
    
    const response = await axios.post(
      `${config.services.mcp}/mcp/servers`,
      { name, type, config: serverConfig },
      { headers: { 'x-user-id': userId, 'x-org-id': orgId } }
    );
    
    res.status(201).json(response.data);
  } catch (error) {
    logger.error('Add MCP server failed', error);
    res.status(500).json({ error: 'Failed to add MCP server' });
  }
});

// Delete MCP server
mcpRouter.delete('/servers/:serverId', async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user?.userId;
    
    await axios.delete(`${config.services.mcp}/mcp/servers/${serverId}`, {
      headers: { 'x-user-id': userId },
    });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Delete MCP server failed', error);
    res.status(500).json({ error: 'Failed to delete MCP server' });
  }
});

// Toggle MCP server
mcpRouter.post('/servers/:serverId/toggle', async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user?.userId;
    
    const response = await axios.post(
      `${config.services.mcp}/mcp/servers/${serverId}/toggle`,
      {},
      { headers: { 'x-user-id': userId } }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Toggle MCP server failed', error);
    res.status(500).json({ error: 'Failed to toggle MCP server' });
  }
});

// Get MCP server tools
mcpRouter.get('/servers/:serverId/tools', async (req: AuthRequest, res: Response) => {
  try {
    const { serverId } = req.params;
    const userId = req.user?.userId;
    
    const response = await axios.get(
      `${config.services.mcp}/mcp/servers/${serverId}/tools`,
      { headers: { 'x-user-id': userId } }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get MCP tools failed', error);
    res.status(500).json({ error: 'Failed to get MCP tools' });
  }
});

// Execute MCP tool
mcpRouter.post('/servers/:serverId/tools/:toolName', async (req: AuthRequest, res: Response) => {
  try {
    const { serverId, toolName } = req.params;
    const userId = req.user?.userId;
    const args = req.body;
    
    const response = await axios.post(
      `${config.services.mcp}/mcp/servers/${serverId}/tools/${toolName}`,
      args,
      { headers: { 'x-user-id': userId } }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Execute MCP tool failed', error);
    res.status(500).json({ error: 'Failed to execute MCP tool' });
  }
});
