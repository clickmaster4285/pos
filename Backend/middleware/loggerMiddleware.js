// middleware/loggerMiddleware.js
import { 
  userActivityLogger, 
  errorLogger, 
  combinedLogger, 
  rejectedLogger 
} from '../utils/logger.js';

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Log combined request
  combinedLogger.info('Incoming request', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Capture response
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    combinedLogger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString()
    });

    // Log rejected requests (4xx and 5xx status codes)
    if (res.statusCode >= 400) {
      rejectedLogger.warn('Request rejected', {
        method: req.method,
        url: req.url,
        statusCode: res.statusCode,
        ip: req.ip,
        duration: `${duration}ms`,
        timestamp: new Date().toISOString()
      });
    }
  });

  next();
};

export const userActivityLoggerMiddleware = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // SPECIAL CASE: Log login and logout activities even without req.user
    console.log('Checking for auth activity logging...',req.url, req.url.includes('/auth/login'));
    if ((req.url.includes('/auth/login') || req.url.includes('/auth/logout')) && 
        res.statusCode >= 200 && res.statusCode < 300) {
      try {
        let userInfo = {};
        
        // For login success - extract user info from response data
        if (req.url.includes('/auth/login') && res.statusCode === 200 && data) {
          try {
            const responseData = typeof data === 'string' ? JSON.parse(data) : data;
            if (responseData.success && responseData.data && responseData.data.user) {
              userInfo = {
                userId: responseData.data.user.userId
              };
            }
          } catch (parseError) {
            // If we can't parse the response, log without user details
            console.error('Error parsing login response:', parseError);
          }
        }
        
        // For logout - use req.user if available, otherwise log as system action
        if (req.url.includes('/auth/logout')) {
          if (req.user) {
            userInfo = {
              userId: req.user.userId || req.user._id,
            };
          } else {
            userInfo = {
              userId: 'system',
            };
          }
        }
        
        userActivityLogger.info('Auth activity', {
          userId: userInfo.userId || 'unknown',
          action: `${req.method} ${req.url}`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode
        });
      } catch (error) {
        console.error('Error logging auth activity:', error);
      }
    }
    // Log other user activities for authenticated users
    else if (req.user && res.statusCode >= 200 && res.statusCode < 300) {
      try {
        userActivityLogger.info('User activity', {
          userId: req.user.userId || req.user._id,
          action: `${req.method} ${req.url}`,
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          timestamp: new Date().toISOString(),
          statusCode: res.statusCode
        });
      } catch (error) {
        console.error('Error logging user activity:', error);
      }
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

export const errorLoggerMiddleware = (error, req, res, next) => {
  errorLogger.error('Application error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userId: req.user ? (req.user.userId || req.user._id) : 'anonymous',
    timestamp: new Date().toISOString()
  });
  
  next(error);
};