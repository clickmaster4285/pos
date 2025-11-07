// utils/logger.js
import { createLogger, format, transports } from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Custom format for user activity logs
const userActivityFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.printf(({ timestamp, level, message, ...meta }) => {
    return JSON.stringify({
      timestamp,
      level,
      message,
      ...meta
    });
  })
);

// Custom format for error logs
const errorFormat = format.combine(
  format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  format.errors({ stack: true }),
  format.json()
);

// Create loggers
export const userActivityLogger = createLogger({
  level: 'info',
  format: userActivityFormat,
  transports: [
    new transports.File({ 
      filename: path.join(logsDir, 'user-activity.log'),
      level: 'info'
    })
  ]
});

export const errorLogger = createLogger({
  level: 'error',
  format: errorFormat,
  transports: [
    new transports.File({ 
      filename: path.join(logsDir, 'error.log'),
      level: 'error'
    })
  ]
});

export const combinedLogger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json()
  ),
  transports: [
    new transports.File({ 
      filename: path.join(logsDir, 'combined.log') 
    })
  ]
});

export const rejectedLogger = createLogger({
  level: 'warn',
  format: format.combine(
    format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    format.json()
  ),
  transports: [
    new transports.File({ 
      filename: path.join(logsDir, 'rejected.log'),
      level: 'warn'
    })
  ]
});

export const exceptionLogger = createLogger({
  level: 'error',
  format: errorFormat,
  transports: [
    new transports.File({ 
      filename: path.join(logsDir, 'exceptions.log')
    })
  ]
});

// Global exception handlers
process.on('uncaughtException', (error) => {
  exceptionLogger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  exceptionLogger.error('Unhandled Rejection', { reason, promise });
});