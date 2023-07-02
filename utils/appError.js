class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true; // this is for understanding that the error is operatinal error only, if it is true
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
