import express, { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';
import { AuthRequest } from '../middleware/auth';

export const taskRouter = express.Router();

// Create a new task
taskRouter.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt, workspaceId, model } = req.body;
    const userId = req.user?.userId;
    const orgId = req.user?.organizationId;
    
    const response = await axios.post(`${config.services.task}/tasks`, {
      prompt,
      workspaceId,
      model,
      userId,
      organizationId: orgId,
    }, {
      headers: {
        'x-user-id': userId,
        'x-org-id': orgId,
      },
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    logger.error('Create task failed', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// Get task by ID
taskRouter.get('/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;
    
    const response = await axios.get(`${config.services.task}/tasks/${taskId}`, {
      headers: {
        'x-user-id': userId,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get task failed', error);
    res.status(404).json({ error: 'Task not found' });
  }
});

// Get task history
taskRouter.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { limit = '50', offset = '0', status } = req.query;
    
    const response = await axios.get(`${config.services.task}/tasks`, {
      params: { limit, offset, status },
      headers: {
        'x-user-id': userId,
      },
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get tasks failed', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Send message to existing task
taskRouter.post('/:taskId/messages', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content, attachments } = req.body;
    const userId = req.user?.userId;
    
    const response = await axios.post(
      `${config.services.task}/tasks/${taskId}/messages`,
      { content, attachments },
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Send message failed', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Cancel task
taskRouter.post('/:taskId/cancel', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;
    
    const response = await axios.post(
      `${config.services.task}/tasks/${taskId}/cancel`,
      {},
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Cancel task failed', error);
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

// Delete task
taskRouter.delete('/:taskId', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;
    
    await axios.delete(`${config.services.task}/tasks/${taskId}`, {
      headers: {
        'x-user-id': userId,
      },
    });
    
    res.status(204).send();
  } catch (error) {
    logger.error('Delete task failed', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get task checkpoints
taskRouter.get('/:taskId/checkpoints', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;
    
    const response = await axios.get(
      `${config.services.task}/tasks/${taskId}/checkpoints`,
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get checkpoints failed', error);
    res.status(500).json({ error: 'Failed to get checkpoints' });
  }
});

// Restore checkpoint
taskRouter.post('/:taskId/checkpoints/:checkpointId/restore', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, checkpointId } = req.params;
    const userId = req.user?.userId;
    const { workspaceOnly } = req.body;
    
    const response = await axios.post(
      `${config.services.task}/tasks/${taskId}/checkpoints/${checkpointId}/restore`,
      { workspaceOnly },
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Restore checkpoint failed', error);
    res.status(500).json({ error: 'Failed to restore checkpoint' });
  }
});

// Approve tool use
taskRouter.post('/:taskId/tools/:toolId/approve', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, toolId } = req.params;
    const userId = req.user?.userId;
    
    const response = await axios.post(
      `${config.services.task}/tasks/${taskId}/tools/${toolId}/approve`,
      {},
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Approve tool failed', error);
    res.status(500).json({ error: 'Failed to approve tool' });
  }
});

// Deny tool use
taskRouter.post('/:taskId/tools/:toolId/deny', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, toolId } = req.params;
    const userId = req.user?.userId;
    const { reason } = req.body;
    
    const response = await axios.post(
      `${config.services.task}/tasks/${taskId}/tools/${toolId}/deny`,
      { reason },
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Deny tool failed', error);
    res.status(500).json({ error: 'Failed to deny tool' });
  }
});

// Get workspace files
taskRouter.get('/:taskId/workspace/files', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId } = req.params;
    const userId = req.user?.userId;
    const { path } = req.query;
    
    const response = await axios.get(
      `${config.services.task}/tasks/${taskId}/workspace/files`,
      {
        params: { path },
        headers: {
          'x-user-id': userId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get workspace files failed', error);
    res.status(500).json({ error: 'Failed to get workspace files' });
  }
});

// Read file
taskRouter.get('/:taskId/workspace/files/:filePath(*)', async (req: AuthRequest, res: Response) => {
  try {
    const { taskId, filePath } = req.params;
    const userId = req.user?.userId;
    
    const response = await axios.get(
      `${config.services.task}/tasks/${taskId}/workspace/files/${filePath}`,
      {
        headers: {
          'x-user-id': userId,
        },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('Read file failed', error);
    res.status(404).json({ error: 'File not found' });
  }
});
