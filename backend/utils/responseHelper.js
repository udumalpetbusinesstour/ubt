/**
 * Standard API Response Helper
 */

/**
 * Format and send a successful API response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object|Array} data - Output data payload
 */
const sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Format and send a failed API response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Object} error - Error details or stack trace
 */
const sendError = (res, statusCode = 500, message = 'Internal Server Error', error = {}) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: process.env.NODE_ENV === 'production' ? {} : error
  });
};

module.exports = {
  sendSuccess,
  sendError
};
