import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Square, Loader2 } from 'lucide-react';
import { useChatStore, type Task, type Message } from '@/stores/chat';
import { taskApi } from '@/services/api';
import { MessageBubble } from './MessageBubble';
import { ToolApprovalPanel } from './ToolApprovalPanel';

interface ChatInterfaceProps {
  task: Task | null;
}

export function ChatInterface({ task }: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const {
    addMessage,
    updateTaskStatus,
    addToolUse,
    updateToolStatus,
    currentTask,
  } = useChatStore();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [task?.messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      if (!currentTask) {
        // Create new task
        const response = await taskApi.create(input);
        useChatStore.getState().setCurrentTask(response.data);
      } else {
        // Send message to existing task
        await taskApi.sendMessage(currentTask.id, input);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!currentTask) return;
    
    try {
      await taskApi.cancel(currentTask.id);
      updateTaskStatus('cancelled');
    } catch (error) {
      console.error('Failed to cancel task:', error);
    }
  };

  const handleApproveTool = async (toolId: string) => {
    if (!currentTask) return;
    
    try {
      await taskApi.approveTool(currentTask.id, toolId);
      updateToolStatus(toolId, 'approved');
    } catch (error) {
      console.error('Failed to approve tool:', error);
    }
  };

  const handleDenyTool = async (toolId: string, reason?: string) => {
    if (!currentTask) return;
    
    try {
      await taskApi.denyTool(currentTask.id, toolId, reason);
      updateToolStatus(toolId, 'denied');
    } catch (error) {
      console.error('Failed to deny tool:', error);
    }
  };

  const pendingTools = task?.tools.filter((t) => t.status === 'pending') || [];

  return (
    <div className="flex flex-col h-full">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!task?.messages.length && (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">Welcome to Cline</h3>
              <p>Describe what you want to build or fix</p>
            </div>
          </div>
        )}
        
        {task?.messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {isLoading && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Tool Approval Panel */}
      {pendingTools.length > 0 && (
        <ToolApprovalPanel
          tools={pendingTools}
          onApprove={handleApproveTool}
          onDeny={handleDenyTool}
        />
      )}

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <button
            type="button"
            className="p-2 hover:bg-secondary rounded-lg transition-colors"
            title="Attach files"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want to build or fix..."
            className="flex-1 px-4 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={isLoading}
          />
          
          {isLoading ? (
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
            >
              <Square className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!input.trim()}
              className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
