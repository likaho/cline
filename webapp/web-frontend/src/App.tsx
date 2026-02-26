import React, { useEffect } from 'react';
import { useAuthStore } from './stores/auth';
import { useChatStore } from './stores/chat';
import { ChatInterface } from './components/chat/ChatInterface';
import { authApi, taskApi } from './services/api';

function App() {
  const { isAuthenticated, setAuth, logout } = useAuthStore();
  const { currentTask, setCurrentTask, setTasks } = useChatStore();

  useEffect(() => {
    // Check if user is logged in
    const checkAuth = async () => {
      try {
        const response = await authApi.me();
        const { accessToken, refreshToken } = useAuthStore.getState();
        if (accessToken && refreshToken) {
          setAuth(response.data, accessToken, refreshToken);
        }
      } catch {
        // Not authenticated
      }
    };
    
    checkAuth();
  }, [setAuth]);

  useEffect(() => {
    // Load tasks when authenticated
    if (isAuthenticated) {
      const loadTasks = async () => {
        try {
          const response = await taskApi.list({ limit: 10 });
          setTasks(response.data);
          
          // Set most recent active task as current
          const activeTask = response.data.find(
            (t: { status: string }) => t.status === 'running' || t.status === 'waiting_approval'
          );
          if (activeTask) {
            setCurrentTask(activeTask);
          }
        } catch (error) {
          console.error('Failed to load tasks:', error);
        }
      };
      
      loadTasks();
    }
  }, [isAuthenticated, setTasks, setCurrentTask]);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => {}} />;
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <header className="border-b px-4 py-3 flex items-center justify-between">
        <h1 className="text-xl font-bold">Cline</h1>
        <div className="flex items-center gap-4">
          <button
            onClick={logout}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Logout
          </button>
        </div>
      </header>
      
      <main className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 border-r p-4 overflow-y-auto">
          <button
            onClick={() => setCurrentTask(null)}
            className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors mb-4"
          >
            New Task
          </button>
          
          <div className="space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground">Recent Tasks</h3>
            {/* Task list would go here */}
          </div>
        </aside>
        
        {/* Chat Area */}
        <section className="flex-1">
          <ChatInterface task={currentTask} />
        </section>
        
        {/* Workspace Panel */}
        <aside className="w-80 border-l p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4">Workspace</h3>
          {/* File browser would go here */}
        </aside>
      </main>
    </div>
  );
}

function LoginPage({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const response = await authApi.login(email, password);
      const { user, accessToken, refreshToken } = response.data;
      useAuthStore.getState().setAuth(user, accessToken, refreshToken);
      onLogin();
    } catch (err) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Cline</h1>
          <p className="text-muted-foreground mt-2">Sign in to continue</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-secondary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;
