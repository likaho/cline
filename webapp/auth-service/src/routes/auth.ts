import express, { Request, Response } from 'express';
import * as userService from '../services/user';

export const authRouter = express.Router();

// Register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      res.status(400).json({ error: 'Email, password, and name are required' });
      return;
    }
    
    const result = await userService.register({ email, password, name });
    res.status(201).json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Registration failed';
    res.status(400).json({ error: message });
  }
});

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }
    
    const result = await userService.login({ email, password });
    res.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Login failed';
    res.status(401).json({ error: message });
  }
});

// Logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);
    
    if (token) {
      await userService.logout(token);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Refresh token
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token is required' });
      return;
    }
    
    const result = await userService.refreshAccessToken(refreshToken);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get current user
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const { verifyToken } = await import('../utils/jwt');
    const decoded = verifyToken(token);
    const user = await userService.getUserById(decoded.userId);
    
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.json(user);
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Update current user
authRouter.put('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);
    
    if (!token) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }
    
    const { verifyToken } = await import('../utils/jwt');
    const decoded = verifyToken(token);
    const { name, email } = req.body;
    
    const updates: { name?: string; email?: string } = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    
    const user = await userService.updateUser(decoded.userId, updates);
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Update failed' });
  }
});

// SSO - Get auth URL
authRouter.get('/sso/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { callbackUrl } = req.query;
    
    // In production, generate OAuth URL based on provider
    const urls: Record<string, string> = {
      google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=...`,
      github: `https://github.com/login/oauth/authorize?client_id=...&redirect_uri=...`,
    };
    
    if (!urls[provider]) {
      res.status(400).json({ error: 'Unsupported provider' });
      return;
    }
    
    res.json({ url: urls[provider] });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate SSO URL' });
  }
});

// SSO - Callback
authRouter.post('/sso/:provider/callback', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { code } = req.body;
    
    // In production, exchange code for tokens and create/find user
    // For now, return a placeholder
    res.status(501).json({ error: 'SSO callback not implemented' });
  } catch (error) {
    res.status(500).json({ error: 'SSO authentication failed' });
  }
});
