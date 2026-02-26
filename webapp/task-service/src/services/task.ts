import { v4 as uuidv4 } from 'uuid';
import { getDb } from './database';
import { getRedisClient } from './redis';
import { config } from '../config';

export type TaskStatus = 'pending' | 'running' | 'waiting_approval' | 'completed' | 'failed' | 'cancelled';

export interface Task {
  id: string;
  userId: string;
  organizationId?: string;
  workspaceId?: string;
  status: TaskStatus;
  prompt: string;
  model?: string;
  messages: TaskMessage[];
  tools: ToolUse[];
  checkpoints: Checkpoint[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface TaskMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: Attachment[];
}

export interface Attachment {
  type: 'file' | 'image' | 'url';
  name: string;
  path?: string;
  content?: string;
}

export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, unknown>;
  output?: string;
  status: 'pending' | 'approved' | 'denied' | 'executed' | 'failed';
  timestamp: Date;
}

export interface Checkpoint {
  id: string;
  taskId: string;
  workspaceSnapshot: string;
  timestamp: Date;
}

export interface CreateTaskInput {
  userId: string;
  organizationId?: string;
  workspaceId?: string;
  prompt: string;
  model?: string;
}

// Create a new task
export async function createTask(input: CreateTaskInput): Promise<Task> {
  const db = getDb();
  const taskId = uuidv4();
  const now = new Date();
  
  const task: Task = {
    id: taskId,
    userId: input.userId,
    organizationId: input.organizationId,
    workspaceId: input.workspaceId,
    status: 'pending',
    prompt: input.prompt,
    model: input.model,
    messages: [],
    tools: [],
    checkpoints: [],
    createdAt: now,
    updatedAt: now,
  };
  
  await db<Task>('tasks').insert(task);
  
  return task;
}

// Get task by ID
export async function getTask(taskId: string): Promise<Task | null> {
  const db = getDb();
  const task = await db<Task>('tasks').where({ id: taskId }).first();
  return task || null;
}

// Get tasks for user
export async function getUserTasks(userId: string, options: {
  limit?: number;
  offset?: number;
  status?: TaskStatus;
}): Promise<Task[]> {
  const db = getDb();
  let query = db<Task>('tasks').where({ userId }).orderBy('createdAt', 'desc');
  
  if (options.status) {
    query = query.where({ status: options.status });
  }
  
  if (options.limit) {
    query = query.limit(options.limit);
  }
  
  if (options.offset) {
    query = query.offset(options.offset);
  }
  
  return query;
}

// Update task status
export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  error?: string
): Promise<void> {
  const db = getDb();
  const updates: Partial<Task> = {
    status,
    updatedAt: new Date(),
  };
  
  if (status === 'completed' || status === 'failed' || status === 'cancelled') {
    updates.completedAt = new Date();
  }
  
  if (error) {
    updates.error = error;
  }
  
  await db<Task>('tasks').where({ id: taskId }).update(updates);
}

// Add message to task
export async function addMessage(taskId: string, message: Omit<TaskMessage, 'id' | 'timestamp'>): Promise<TaskMessage> {
  const db = getDb();
  const newMessage: TaskMessage = {
    ...message,
    id: uuidv4(),
    timestamp: new Date(),
  };
  
  await db('task_messages').insert({
    id: newMessage.id,
    taskId,
    role: newMessage.role,
    content: newMessage.content,
    timestamp: newMessage.timestamp,
    attachments: JSON.stringify(newMessage.attachments || []),
  });
  
  await db<Task>('tasks').where({ id: taskId }).update({ updatedAt: new Date() });
  
  return newMessage;
}

// Request tool approval (human-in-the-loop)
export async function requestToolApproval(taskId: string, tool: ToolUse): Promise<void> {
  const db = getDb();
  
  await db('task_tools').insert({
    id: tool.id,
    taskId,
    name: tool.name,
    input: JSON.stringify(tool.input),
    status: 'pending',
    timestamp: tool.timestamp,
  });
  
  await updateTaskStatus(taskId, 'waiting_approval');
  
  // Notify via WebSocket/pub-sub
  const redis = await getRedisClient();
  await redis.publish(`task:${taskId}:approval`, JSON.stringify({
    type: 'tool_approval',
    tool,
  }));
}

// Approve tool
export async function approveTool(taskId: string, toolId: string): Promise<void> {
  const db = getDb();
  
  await db('task_tools')
    .where({ id: toolId, taskId })
    .update({ status: 'approved' });
  
  // Check if all tools are approved
  const pending = await db('task_tools')
    .where({ taskId, status: 'pending' })
    .count('* as count');
  
  if ((pending[0] as { count: number }).count === 0) {
    await updateTaskStatus(taskId, 'running');
  }
  
  // Notify via Redis
  const redis = await getRedisClient();
  await redis.publish(`task:${taskId}:tool:${toolId}`, JSON.stringify({
    type: 'approved',
    toolId,
  }));
}

// Deny tool
export async function denyTool(taskId: string, toolId: string, reason?: string): Promise<void> {
  const db = getDb();
  
  await db('task_tools')
    .where({ id: toolId, taskId })
    .update({ status: 'denied' });
  
  // Notify via Redis
  const redis = await getRedisClient();
  await redis.publish(`task:${taskId}:tool:${toolId}`, JSON.stringify({
    type: 'denied',
    toolId,
    reason,
  }));
}

// Create checkpoint
export async function createCheckpoint(taskId: string, workspaceSnapshot: string): Promise<Checkpoint> {
  const db = getDb();
  const checkpoint: Checkpoint = {
    id: uuidv4(),
    taskId,
    workspaceSnapshot,
    timestamp: new Date(),
  };
  
  await db('task_checkpoints').insert({
    id: checkpoint.id,
    taskId,
    workspaceSnapshot,
    timestamp: checkpoint.timestamp,
  });
  
  return checkpoint;
}

// Get checkpoints
export async function getCheckpoints(taskId: string): Promise<Checkpoint[]> {
  const db = getDb();
  return db<Task>('task_checkpoints').where({ taskId }).orderBy('timestamp', 'desc');
}

// Delete task
export async function deleteTask(taskId: string): Promise<void> {
  const db = getDb();
  
  await db('task_messages').where({ taskId }).del();
  await db('task_tools').where({ taskId }).del();
  await db('task_checkpoints').where({ taskId }).del();
  await db('tasks').where({ id: taskId }).del();
}

// Cancel task
export async function cancelTask(taskId: string): Promise<void> {
  await updateTaskStatus(taskId, 'cancelled');
  
  // Notify execution to stop
  const redis = await getRedisClient();
  await redis.publish(`task:${taskId}:cancel`, JSON.stringify({ type: 'cancel' }));
}
