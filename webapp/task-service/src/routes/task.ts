import express, { Request, Response } from 'express';
import * as taskService from '../services/task';
import { executeTask, initializeTask } from '../services/executor';

export const taskRouter = express.Router();

// Create task
taskRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const orgId = req.headers['x-org-id'] as string;
    const { prompt, workspaceId, model } = req.body;
    
    if (!prompt) {
      res.status(400).json({ error: 'Prompt is required' });
      return;
    }
    
    const task = await taskService.createTask({
      userId,
      organizationId: orgId,
      workspaceId,
      prompt,
      model,
    });
    
    // Start task execution in background
    executeTask(task.id).catch(console.error);
    
    res.status(201).json(task);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create task';
    res.status(500).json({ error: message });
  }
});

// Get task
taskRouter.get('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const task = await taskService.getTask(taskId);
    
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get task' });
  }
});

// Get user tasks
taskRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = req.headers['x-user-id'] as string;
    const { limit = '50', offset = '0', status } = req.query;
    
    const tasks = await taskService.getUserTasks(userId, {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
      status: status as taskService.TaskStatus | undefined,
    });
    
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// Send message to task
taskRouter.post('/:taskId/messages', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const { content, attachments } = req.body;
    
    if (!content) {
      res.status(400).json({ error: 'Content is required' });
      return;
    }
    
    const message = await taskService.addMessage(taskId, {
      role: 'user',
      content,
      attachments,
    });
    
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Cancel task
taskRouter.post('/:taskId/cancel', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    await taskService.cancelTask(taskId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel task' });
  }
});

// Delete task
taskRouter.delete('/:taskId', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    await taskService.deleteTask(taskId);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Get checkpoints
taskRouter.get('/:taskId/checkpoints', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.params;
    const checkpoints = await taskService.getCheckpoints(taskId);
    res.json(checkpoints);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get checkpoints' });
  }
});

// Restore checkpoint
taskRouter.post('/:taskId/checkpoints/:checkpointId/restore', async (req: Request, res: Response) => {
  try {
    const { taskId, checkpointId } = req.params;
    // Implementation would restore workspace from checkpoint
    res.json({ success: true, checkpointId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to restore checkpoint' });
  }
});

// Approve tool
taskRouter.post('/:taskId/tools/:toolId/approve', async (req: Request, res: Response) => {
  try {
    const { taskId, toolId } = req.params;
    await taskService.approveTool(taskId, toolId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve tool' });
  }
});

// Deny tool
taskRouter.post('/:taskId/tools/:toolId/deny', async (req: Request, res: Response) => {
  try {
    const { taskId, toolId } = req.params;
    const { reason } = req.body;
    await taskService.denyTool(taskId, toolId, reason);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to deny tool' });
  }
});
