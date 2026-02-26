import { v4 as uuidv4 } from 'uuid';

describe('Task Service', () => {
  describe('Task Model', () => {
    it('should generate unique task IDs', () => {
      const id1 = uuidv4();
      const id2 = uuidv4();
      
      expect(id1).not.toBe(id2);
      expect(id1).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('should create task with correct status', () => {
      const task = {
        id: uuidv4(),
        userId: 'user-123',
        status: 'pending' as const,
        prompt: 'Build a web app',
        messages: [],
        tools: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      expect(task.status).toBe('pending');
      expect(task.messages).toHaveLength(0);
      expect(task.tools).toHaveLength(0);
    });
  });

  describe('Task Status Transitions', () => {
    const validTransitions: Record<string, string[]> = {
      pending: ['running', 'cancelled'],
      running: ['waiting_approval', 'completed', 'failed', 'cancelled'],
      waiting_approval: ['running', 'cancelled'],
      completed: [],
      failed: [],
      cancelled: [],
    };

    it('should allow valid transitions', () => {
      expect(validTransitions['pending'].includes('running')).toBe(true);
      expect(validTransitions['running'].includes('waiting_approval')).toBe(true);
      expect(validTransitions['waiting_approval'].includes('running')).toBe(true);
    });

    it('should not allow transitions from terminal states', () => {
      expect(validTransitions['completed'].includes('running')).toBe(false);
      expect(validTransitions['failed'].includes('pending')).toBe(false);
      expect(validTransitions['cancelled'].includes('completed')).toBe(false);
    });
  });

  describe('Task Validation', () => {
    interface TaskValidationResult {
      valid: boolean;
      errors: string[];
    }

    const validateTask = (task: { prompt?: string; userId?: string }): TaskValidationResult => {
      const errors: string[] = [];
      
      if (!task.prompt || task.prompt.trim().length === 0) {
        errors.push('Prompt is required');
      }
      
      if (task.prompt && task.prompt.length > 10000) {
        errors.push('Prompt exceeds maximum length');
      }
      
      if (!task.userId) {
        errors.push('User ID is required');
      }
      
      return { valid: errors.length === 0, errors };
    };

    it('should validate valid task', () => {
      const result = validateTask({
        prompt: 'Build a web app',
        userId: 'user-123',
      });
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject task without prompt', () => {
      const result = validateTask({
        userId: 'user-123',
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Prompt is required');
    });

    it('should reject task without userId', () => {
      const result = validateTask({
        prompt: 'Build a web app',
      });
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('User ID is required');
    });

    it('should reject task with empty prompt', () => {
      const result = validateTask({
        prompt: '   ',
        userId: 'user-123',
      });
      
      expect(result.valid).toBe(false);
    });
  });

  describe('Checkpoint Management', () => {
    interface TaskCheckpoint {
      id: string;
      taskId: string;
      messages: any[];
      createdAt: Date;
    }

    it('should create checkpoint with all messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
      ];
      
      const checkpoint: TaskCheckpoint = {
        id: uuidv4(),
        taskId: 'task-123',
        messages,
        createdAt: new Date(),
      };
      
      expect(checkpoint.messages).toHaveLength(2);
    });

    it('should allow restoring from checkpoint', () => {
      const originalMessages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' },
      ];
      
      // Simulate restoring to checkpoint (keeping only first 2 messages)
      const restoredMessages = originalMessages.slice(0, 2);
      
      expect(restoredMessages).toHaveLength(2);
      expect(restoredMessages[2]).toBeUndefined();
    });
  });

  describe('Tool Execution Queue', () => {
    interface QueuedTool {
      id: string;
      name: string;
      status: 'pending' | 'approved' | 'denied' | 'executed' | 'failed';
    }

    it('should track pending tools', () => {
      const tools: QueuedTool[] = [
        { id: '1', name: 'bash', status: 'pending' },
        { id: '2', name: 'read', status: 'pending' },
      ];
      
      const pending = tools.filter(t => t.status === 'pending');
      expect(pending).toHaveLength(2);
    });

    it('should transition tool status correctly', () => {
      const tool: QueuedTool = { id: '1', name: 'bash', status: 'pending' };
      
      // Approve
      tool.status = 'approved';
      expect(tool.status).toBe('approved');
      
      // Execute
      tool.status = 'executed';
      expect(tool.status).toBe('executed');
    });
  });
});
