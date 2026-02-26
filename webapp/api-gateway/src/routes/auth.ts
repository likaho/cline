import express, { Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';
import { logger } from '../utils/logger';

export const authRouter = express.Router();

// Login
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    const response = await axios.post(`${config.services.auth}/auth/login`, {
      email,
      password,
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Login failed', error);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Register
authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;
    
    const response = await axios.post(`${config.services.auth}/auth/register`, {
      email,
      password,
      name,
    });
    
    res.status(201).json(response.data);
  } catch (error) {
    logger.error('Registration failed', error);
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Logout
authRouter.post('/logout', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    await axios.post(`${config.services.auth}/auth/logout`, {}, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    res.json({ success: true });
  } catch (error) {
    logger.error('Logout failed', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Refresh token
authRouter.post('/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;
    
    const response = await axios.post(`${config.services.auth}/auth/refresh`, {
      refreshToken,
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Token refresh failed', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Get current user
authRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    
    const response = await axios.get(`${config.services.auth}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    res.json(response.data);
  } catch (error) {
    logger.error('Get user failed', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
});

// SSO Login
authRouter.get('/sso/:provider', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { callbackUrl } = req.query;
    
    const response = await axios.get(
      `${config.services.auth}/auth/sso/${provider}`, {
        params: { callbackUrl },
      }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('SSO init failed', error);
    res.status(400).json({ error: 'SSO not available' });
  }
});

// SSO Callback
authRouter.get('/sso/:provider/callback', async (req: Request, res: Response) => {
  try {
    const { provider } = req.params;
    const { code } = req.query;
    
    const response = await axios.post(
      `${config.services.auth}/auth/sso/${provider}/callback`,
      { code }
    );
    
    res.json(response.data);
  } catch (error) {
    logger.error('SSO callback failed', error);
    res.status(400).json({ error: 'SSO authentication failed' });
  }
});
