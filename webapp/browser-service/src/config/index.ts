import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '8084', 10),
  env: process.env.NODE_ENV || 'development',
  
  // Browser pool settings
  pool: {
    minSize: parseInt(process.env.BROWSER_POOL_MIN || '2', 10),
    maxSize: parseInt(process.env.BROWSER_POOL_MAX || '10', 10),
    launchTimeout: parseInt(process.env.BROWSER_LAUNCH_TIMEOUT || '30000', 10),
    idleTimeout: parseInt(process.env.BROWSER_IDLE_TIMEOUT || '300000', 10), // 5 minutes
  },
  
  // Browser settings
  browser: {
    headless: process.env.BROWSER_HEADLESS !== 'false',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--disable-web-security',
    ],
    userDataDir: process.env.BROWSER_USER_DATA_DIR || '/tmp/puppeteer',
  },
  
  // Puppeteer/Chrome path
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
  
  // Redis for session management
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  
  otel: {
    endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318',
    serviceName: 'browser-service',
  },
};
