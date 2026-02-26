import { v4 as uuidv4 } from 'uuid';
import axios from 'axios';
import * as taskService from './task';
import { config } from '../config';
import { publishTaskEvent } from './redis';

export interface ExecutionContext {
  taskId: string;
  userId: string;
  workspaceId?: string;
  messages: Array<{ role: string; content: string }>;
  model?: string;
  isCancelled: boolean;
}

// Initialize task execution
export async function initializeTask(taskId: string): Promise<void> {
  const task = await taskService.getTask(taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  // Add initial user message
  await taskService.addMessage(taskId, {
    role: 'user',
    content: task.prompt,
  });
  
  await taskService.updateTaskStatus(taskId, 'running');
}

// Run task execution loop
export async function executeTask(taskId: string): Promise<void> {
  const task = await taskService.getTask(taskId);
  if (!task) {
    throw new Error('Task not found');
  }
  
  const context: ExecutionContext = {
    taskId,
    userId: task.userId,
    workspaceId: task.workspaceId,
    messages: [{ role: 'user', content: task.prompt }],
    model: task.model,
    isCancelled: false,
  };
  
  try {
    await taskService.updateTaskStatus(taskId, 'running');
    
    let stepCount = 0;
    const maxSteps = config.task.maxSteps;
    
    while (stepCount < maxSteps && !context.isCancelled) {
      stepCount++;
      
      // Send to AI service
      const response = await callAIService(context);
      
      // Add assistant response to messages
      const assistantMessage = await taskService.addMessage(taskId, {
        role: 'assistant',
        content: response.content,
      });
      
      context.messages.push({ role: 'assistant', content: response.content });
      
      // Check if task is complete
      if (response.stopReason === 'end_turn' || response.stopReason === 'max_tokens') {
        await taskService.updateTaskStatus(taskId, 'completed');
        await publishTaskEvent(`task:${taskId}`, {
          type: 'completed',
          result: response.content,
        });
        return;
      }
      
      // Handle tool use
      if (response.toolUses && response.toolUses.length > 0) {
        for (const toolUse of response.toolUses) {
          const tool = {
            id: uuidv4(),
            name: toolUse.name,
            input: toolUse.input,
            status: 'pending' as const,
            timestamp: new Date(),
          };
          
          // Request human approval
          await taskService.requestToolApproval(taskId, tool);
          
          // Wait for approval (will be handled by WebSocket/Redis)
          await waitForApproval(taskId, tool.id);
          
          // Execute approved tool
          const result = await executeTool(toolUse.name, toolUse.input, context);
          
          // Add tool result to messages
          const toolResultMessage = await taskService.addMessage(taskId, {
            role: 'system',
            content: `Tool ${toolUse.name} result: ${result}`,
          });
          
          context.messages.push({ role: 'system', content: toolResultMessage.content });
        }
      }
    }
    
    if (context.isCancelled) {
      await taskService.updateTaskStatus(taskId, 'cancelled');
    } else {
      await taskService.updateTaskStatus(taskId, 'completed');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await taskService.updateTaskStatus(taskId, 'failed', errorMessage);
    await publishTaskEvent(`task:${taskId}`, {
      type: 'failed',
      error: errorMessage,
    });
  }
}

// Call AI service
async function callAIService(context: ExecutionContext): Promise<{
  content: string;
  stopReason: string;
  toolUses?: Array<{ name: string; input: Record<string, unknown> }>;
}> {
  const response = await axios.post(`${config.services.ai}/ai/chat`, {
    messages: context.messages,
    model: context.model,
    taskId: context.taskId,
  }, {
    headers: {
      'x-user-id': context.userId,
    },
  });
  
  return response.data;
}

// Execute a tool
async function executeTool(
  toolName: string,
  input: Record<string, unknown>,
  context: ExecutionContext
): Promise<string> {
  // Route to appropriate service based on tool name
  if (toolName.startsWith('mcp_')) {
    return executeMCPTool(toolName, input, context);
  } else if (toolName === 'bash' || toolName === 'shell') {
    return executeTerminalCommand(input.command as string, context);
  } else if (toolName === 'read' || toolName === 'write' || toolName === 'edit') {
    return executeFileOperation(toolName, input, context);
  } else if (toolName === 'browser') {
    return executeBrowserOperation(input, context);
  }
  
  return JSON.stringify({ error: `Unknown tool: ${toolName}` });
}

// Execute MCP tool
async function executeMCPTool(
  toolName: string,
  input: Record<string, unknown>,
  context: ExecutionContext
): Promise<string> {
  const response = await axios.post(`${config.services.mcp}/tools/execute`, {
    toolName,
    input,
    taskId: context.taskId,
  }, {
    headers: { 'x-user-id': context.userId },
  });
  
  return response.data.result;
}

// Execute terminal command
async function executeTerminalCommand(
  command: string,
  context: ExecutionContext
): Promise<string> {
  // In production, this would execute via secure shell service
  return JSON.stringify({
    stdout: 'Terminal execution would happen here',
    stderr: '',
    exitCode: 0,
  });
}

// Execute file operation
async function executeFileOperation(
  operation: string,
  input: Record<string, unknown>,
  context: ExecutionContext
): Promise<string> {
  const response = await axios.post(`${config.services.storage}/storage/file/${operation}`, {
    ...input,
    workspaceId: context.workspaceId,
  }, {
    headers: { 'x-user-id': context.userId },
  });
  
  return response.data.result;
}

// Execute browser operation
async function executeBrowserOperation(
  input: Record<string, unknown>,
  context: ExecutionContext
): Promise<string> {
  const response = await axios.post(`${config.services.browser}/browser/execute`, {
    ...input,
    taskId: context.taskId,
  }, {
    headers: { 'x-user-id': context.userId },
  });
  
  return response.data.result;
}

// Wait for tool approval via Redis
async function waitForApproval(taskId: string, toolId: string): Promise<boolean> {
  return new Promise((resolve) => {
    // In production, subscribe to Redis channel and wait
    // For now, auto-approve after a timeout
    setTimeout(() => {
      resolve(true);
    }, 5000);
  });
}

// Check if task is cancelled
export async function checkCancellation(taskId: string): Promise<boolean> {
  const task = await taskService.getTask(taskId);
  return task?.status === 'cancelled';
}
