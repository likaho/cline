import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';
import { config } from '../config';
import { logger } from '../utils/logger';
import { activeWebSocketConnections } from '../services/metrics';
import { verifyToken } from '../utils/jwt';

interface AuthenticatedWebSocket extends WebSocket {
  userId?: string;
  organizationId?: string;
  isAlive?: boolean;
}

export function createWebSocketServer(server: Server): WebSocketServer {
  const wss = new WebSocketServer({
    server,
    path: '/ws',
  });

  wss.on('connection', (ws: AuthenticatedWebSocket, req) => {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (!token) {
      ws.close(4001, 'Authentication required');
      return;
    }

    try {
      const decoded = verifyToken(token);
      ws.userId = decoded.userId;
      ws.organizationId = decoded.organizationId;
      ws.isAlive = true;
    } catch (error) {
      ws.close(4001, 'Invalid token');
      return;
    }

    activeWebSocketConnections.inc({ direction: 'connected' });
    logger.info('WebSocket client connected', { userId: ws.userId });

    ws.on('pong', () => {
      ws.isAlive = true;
    });

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message.toString());
        handleMessage(ws, data);
      } catch (error) {
        logger.error('Failed to parse WebSocket message', error);
        ws.send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });

    ws.on('close', () => {
      activeWebSocketConnections.inc({ direction: 'disconnected' });
      logger.info('WebSocket client disconnected', { userId: ws.userId });
    });

    ws.on('error', (error) => {
      logger.error('WebSocket error', error);
    });

    ws.send(JSON.stringify({ type: 'connected', userId: ws.userId }));
  });

  const interval = setInterval(() => {
    wss.clients.forEach((ws: AuthenticatedWebSocket) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, config.ws.pingInterval);

  wss.on('close', () => {
    clearInterval(interval);
  });

  return wss;
}

function handleMessage(ws: AuthenticatedWebSocket, data: {
  type: string;
  payload: unknown;
}): void {
  switch (data.type) {
    case 'subscribe':
      handleSubscribe(ws, data.payload as { taskId: string });
      break;
    case 'unsubscribe':
      handleUnsubscribe(ws, data.payload as { taskId: string });
      break;
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong' }));
      break;
    default:
      ws.send(JSON.stringify({ error: 'Unknown message type' }));
  }
}

function handleSubscribe(ws: AuthenticatedWebSocket, payload: { taskId: string }): void {
  logger.debug('Subscribed to task', { taskId: payload.taskId, userId: ws.userId });
  ws.send(JSON.stringify({ type: 'subscribed', taskId: payload.taskId }));
}

function handleUnsubscribe(ws: AuthenticatedWebSocket, payload: { taskId: string }): void {
  logger.debug('Unsubscribed from task', { taskId: payload.taskId, userId: ws.userId });
  ws.send(JSON.stringify({ type: 'unsubscribed', taskId: payload.taskId }));
}

export function websocketHandler(req: Request, res: Response): void {
  res.status(426).json({ error: 'WebSocket upgrade required' });
}
