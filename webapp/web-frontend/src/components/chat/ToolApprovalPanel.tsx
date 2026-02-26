import React from 'react';
import { Check, X, Terminal, FileText, Globe } from 'lucide-react';
import { type ToolUse } from '@/stores/chat';

interface ToolApprovalPanelProps {
  tools: ToolUse[];
  onApprove: (toolId: string) => void;
  onDeny: (toolId: string, reason?: string) => void;
}

export function ToolApprovalPanel({ tools, onApprove, onDeny }: ToolApprovalPanelProps) {
  const getToolIcon = (toolName: string) => {
    if (toolName.includes('bash') || toolName.includes('shell')) {
      return <Terminal className="w-4 h-4" />;
    }
    if (toolName.includes('file') || toolName.includes('read') || toolName.includes('write')) {
      return <FileText className="w-4 h-4" />;
    }
    if (toolName.includes('browser') || toolName.includes('http')) {
      return <Globe className="w-4 h-4" />;
    }
    return <Terminal className="w-4 h-4" />;
  };

  const getToolDescription = (tool: ToolUse) => {
    const input = tool.input;
    
    if (tool.name === 'bash' || tool.name === 'shell') {
      return `Run command: ${input.command}`;
    }
    if (tool.name === 'read') {
      return `Read file: ${input.file_path}`;
    }
    if (tool.name === 'write') {
      return `Write to: ${input.file_path}`;
    }
    if (tool.name === 'browser') {
      return `Browser action: ${input.action}`;
    }
    
    return JSON.stringify(input, null, 2);
  };

  return (
    <div className="border-t bg-muted/30 p-4">
      <h4 className="font-semibold mb-3">Tool Approval Required</h4>
      <div className="space-y-3">
        {tools.map((tool) => (
          <div key={tool.id} className="bg-background rounded-lg p-3 border">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-secondary rounded-lg">
                {getToolIcon(tool.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{tool.name}</div>
                <pre className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap break-all">
                  {getToolDescription(tool)}
                </pre>
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => onApprove(tool.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
              >
                <Check className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => onDeny(tool.id)}
                className="flex items-center gap-1 px-3 py-1.5 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/90 transition-colors text-sm"
              >
                <X className="w-4 h-4" />
                Deny
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
