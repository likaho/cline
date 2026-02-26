import { useChatStore, type Task, type Message, type ToolUse } from '@/stores/chat';

describe('Chat Store', () => {
  beforeEach(() => {
    // Reset store before each test
    useChatStore.setState({
      currentTask: null,
      tasks: [],
      isLoading: false,
    });
  });

  const createMockTask = (overrides?: Partial<Task>): Task => ({
    id: 'task-123',
    status: 'pending',
    messages: [],
    tools: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  const createMockMessage = (overrides?: Partial<Message>): Message => ({
    id: 'msg-123',
    role: 'user',
    content: 'Hello',
    timestamp: new Date(),
    ...overrides,
  });

  it('should have initial state', () => {
    const state = useChatStore.getState();
    
    expect(state.currentTask).toBeNull();
    expect(state.tasks).toEqual([]);
    expect(state.isLoading).toBe(false);
  });

  it('should set current task', () => {
    const { setCurrentTask } = useChatStore.getState();
    const task = createMockTask();
    
    setCurrentTask(task);
    
    const state = useChatStore.getState();
    expect(state.currentTask).toEqual(task);
  });

  it('should set tasks list', () => {
    const { setTasks } = useChatStore.getState();
    const tasks = [
      createMockTask({ id: 'task-1' }),
      createMockTask({ id: 'task-2' }),
    ];
    
    setTasks(tasks);
    
    const state = useChatStore.getState();
    expect(state.tasks).toHaveLength(2);
  });

  it('should add message to current task', () => {
    const { setCurrentTask, addMessage } = useChatStore.getState();
    const task = createMockTask();
    setCurrentTask(task);
    
    const message = createMockMessage({ content: 'New message' });
    addMessage(message);
    
    const state = useChatStore.getState();
    expect(state.currentTask?.messages).toHaveLength(1);
    expect(state.currentTask?.messages[0].content).toBe('New message');
  });

  it('should update task status', () => {
    const { setCurrentTask, updateTaskStatus } = useChatStore.getState();
    const task = createMockTask({ status: 'pending' });
    setCurrentTask(task);
    
    updateTaskStatus('running');
    
    const state = useChatStore.getState();
    expect(state.currentTask?.status).toBe('running');
  });

  it('should add tool use', () => {
    const { setCurrentTask, addToolUse } = useChatStore.getState();
    const task = createMockTask();
    setCurrentTask(task);
    
    const tool: ToolUse = {
      id: 'tool-1',
      name: 'bash',
      input: { command: 'ls' },
      status: 'pending',
    };
    addToolUse(tool);
    
    const state = useChatStore.getState();
    expect(state.currentTask?.tools).toHaveLength(1);
    expect(state.currentTask?.tools[0].name).toBe('bash');
  });

  it('should update tool status', () => {
    const { setCurrentTask, addToolUse, updateToolStatus } = useChatStore.getState();
    const task = createMockTask();
    setCurrentTask(task);
    
    const tool: ToolUse = {
      id: 'tool-1',
      name: 'bash',
      input: { command: 'ls' },
      status: 'pending',
    };
    addToolUse(tool);
    updateToolStatus('tool-1', 'approved');
    
    const state = useChatStore.getState();
    expect(state.currentTask?.tools[0].status).toBe('approved');
  });

  it('should set loading state', () => {
    const { setLoading } = useChatStore.getState();
    
    setLoading(true);
    
    const state = useChatStore.getState();
    expect(state.isLoading).toBe(true);
    
    setLoading(false);
    
    const state2 = useChatStore.getState();
    expect(state2.isLoading).toBe(false);
  });
});
