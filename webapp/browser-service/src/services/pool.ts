import puppeteer, { Browser, Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config';

export interface BrowserSession {
  id: string;
  browser: Browser;
  page: Page;
  userId?: string;
  taskId?: string;
  createdAt: Date;
  lastUsed: Date;
  status: 'idle' | 'active' | 'closing';
}

class BrowserPool {
  private sessions: Map<string, BrowserSession> = new Map();
  private availableSessions: BrowserSession[] = [];
  private pendingLaunches: Promise<BrowserSession>[] = [];
  
  constructor() {
    // Initialize pool with minimum browsers
    this.initialize();
  }
  
  private async initialize(): Promise<void> {
    console.log(`Initializing browser pool with ${config.pool.minSize} browsers...`);
    
    const launchPromises: Promise<BrowserSession>[] = [];
    for (let i = 0; i < config.pool.minSize; i++) {
      launchPromises.push(this.launchBrowser());
    }
    
    const sessions = await Promise.all(launchPromises);
    sessions.forEach(session => {
      this.availableSessions.push(session);
    });
    
    console.log(`Browser pool initialized with ${sessions.length} browsers`);
  }
  
  private async launchBrowser(): Promise<BrowserSession> {
    const browser = await puppeteer.launch({
      headless: config.browser.headless,
      args: config.browser.args,
      executablePath: config.executablePath,
      userDataDir: undefined, // Would be unique per session in production
    });
    
    const page = await browser.newPage();
    
    const session: BrowserSession = {
      id: uuidv4(),
      browser,
      page,
      createdAt: new Date(),
      lastUsed: new Date(),
      status: 'idle',
    };
    
    this.sessions.set(session.id, session);
    
    // Set up page event handlers
    page.on('console', (msg) => {
      console.log(`[Browser ${session.id}] Console:`, msg.text());
    });
    
    page.on('pageerror', (error) => {
      console.error(`[Browser ${session.id}] Page error:`, error.message);
    });
    
    return session;
  }
  
  async acquire(userId?: string, taskId?: string): Promise<BrowserSession> {
    // Try to get an available session
    let session = this.availableSessions.pop();
    
    if (!session) {
      // If we haven't hit max size, launch a new browser
      if (this.sessions.size < config.pool.maxSize) {
        session = await this.launchBrowser();
      } else {
        // Wait for a session to become available
        session = await this.waitForAvailableBrowser();
      }
    }
    
    session.status = 'active';
    session.userId = userId;
    session.taskId = taskId;
    session.lastUsed = new Date();
    
    return session;
  }
  
  async release(session: BrowserSession): Promise<void> {
    if (session.status === 'closing') {
      return;
    }
    
    // Navigate to about:blank to reset state
    try {
      await session.page.goto('about:blank', { waitUntil: 'networkidle0' });
    } catch (error) {
      console.error('Failed to reset page:', error);
      // If page is broken, recreate it
      await this.recreatePage(session);
    }
    
    session.status = 'idle';
    this.availableSessions.push(session);
  }
  
  private async waitForAvailableBrowser(): Promise<BrowserSession> {
    return new Promise((resolve) => {
      const check = () => {
        const session = this.availableSessions.pop();
        if (session) {
          resolve(session);
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  }
  
  private async recreatePage(session: BrowserSession): Promise<void> {
    try {
      await session.page.close();
    } catch {}
    
    const page = await session.browser.newPage();
    session.page = page;
  }
  
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    
    session.status = 'closing';
    
    try {
      await session.page.close();
      await session.browser.close();
    } catch (error) {
      console.error('Error closing browser:', error);
    }
    
    this.sessions.delete(sessionId);
    
    // Launch replacement if below minimum
    if (this.sessions.size < config.pool.minSize) {
      const newSession = await this.launchBrowser();
      this.availableSessions.push(newSession);
    }
  }
  
  getStats(): { total: number; available: number; active: number } {
    let active = 0;
    let idle = 0;
    
    for (const session of this.sessions.values()) {
      if (session.status === 'active') active++;
      else if (session.status === 'idle') idle++;
    }
    
    return {
      total: this.sessions.size,
      available: idle,
      active,
    };
  }
  
  async cleanup(): Promise<void> {
    console.log('Cleaning up browser pool...');
    
    for (const session of this.sessions.values()) {
      try {
        await session.page.close();
        await session.browser.close();
      } catch (error) {
        console.error('Error closing browser:', error);
      }
    }
    
    this.sessions.clear();
    this.availableSessions = [];
  }
}

export const browserPool = new BrowserPool();
