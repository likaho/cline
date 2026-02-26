import React from 'react';
import ReactMarkdown from 'react-markdown';
import { User, Bot, System } from 'lucide-react';
import { type Message } from '@/stores/chat';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-primary text-primary-foreground' : 
        isSystem ? 'bg-muted text-muted-foreground' : 
        'bg-secondary text-secondary-foreground'
      }`}>
        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
      </div>
      
      <div className={`flex-1 max-w-[80%] ${
        isUser ? 'text-right' : ''
      }`}>
        <div className={`inline-block px-4 py-2 rounded-lg ${
          isUser ? 'bg-primary text-primary-foreground' : 
          isSystem ? 'bg-muted text-muted-foreground italic' :
          'bg-secondary text-secondary-foreground'
        }`}>
          <ReactMarkdown
            components={{
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '');
                return match ? (
                  <code className={`${className} bg-muted px-1 py-0.5 rounded`} {...props}>
                    {children}
                  </code>
                ) : (
                  <code className="bg-muted px-1 py-0.5 rounded" {...props}>
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
        
        <div className="text-xs text-muted-foreground mt-1">
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
