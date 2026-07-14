const ApiLog = require('../models/ApiLog');

const apiLogMiddleware = async (req, res, next) => {
  const startTime = process.hrtime();

  res.on('finish', async () => {
    // Avoid logging performance checks or asset uploads to prevent self-logging overhead and DB loops
    const url = req.originalUrl || '';
    const isPerformanceRoute = url.includes('/api-logs') || 
                               url.includes('/api/admin/api-logs') ||
                               url.includes('/api/admin/api-performance-stats');

    if (isPerformanceRoute || url.includes('/uploads') || req.method === 'OPTIONS') {
      return;
    }

    const diff = process.hrtime(startTime);
    const responseTimeMs = Math.round((diff[0] * 1e9 + diff[1]) / 1e6);

    try {
      const userId = req.user ? req.user._id : null;
      const userEmail = req.user ? req.user.email : null;
      const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;

      await ApiLog.create({
        method: req.method,
        path: req.baseUrl + req.path,
        statusCode: res.statusCode,
        responseTime: responseTimeMs,
        ip: ipAddress,
        user: userId,
        userEmail: userEmail,
        timestamp: new Date()
      });
    } catch (err) {
      console.error('[API LOG MIDDLEWARE] Error logging API performance:', err.message);
    }
  });

  next();
};

module.exports = apiLogMiddleware;
