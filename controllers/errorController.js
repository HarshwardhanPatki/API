const AppError = require('./../utils/appError');
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/(["'])(?:\\.|[^\\])*?\1/)[0];
  const message = `Duplicate field value: ${value} . Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map((ele) => ele.message);
  const message = `invalid input data. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const sendErrorForDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorForProduction = (err, res) => {
  // Operatinal, trusted error : send message to the client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });

    // Programming or other unknown error: don't want to leak error details to the client.
  } else {
    // for us developers to know that this error occured for that
    //1: log the error.
    console.error('ERROR : 1;', err);
    // 2: send the generic message.
    res.status(500).json({
      status: 'err',
      message: 'Something went Wrong',
    });
  }
};

const handleJWTError = () => {
  return new AppError('Invalid Token! Please login again', 401);
};
const handleJWTExpiredError = () => {
  return new AppError('Your Token has Expired! Please login again. ', 401);
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  if (process.env.NODE_ENV === 'development') {
    sendErrorForDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // there are 3 types of errors that might be created by mongoose and which we need to mark as operational errors so that we can send back meaningful error messages to clients in production
    // HANDLING INVALID DATABASE IDs

    // handling the error if the client enters the wrong tourID, mongooes is not able to detect/convert it into mongoDB ID
    // in production we need to send the meaningful error messages to the client, thus handling in the production environment
    let error = { ...err };
    // 1: trying invalid ID
    if (error.name === 'CastError') error = handleCastErrorDB(error);

    // 2: duplicate key error (does not have any meaningful error we have to change it)
    if (error.code === 11000) error = handleDuplicateFieldsDB(error);
    // 3: update tour validation
    if (error.name === 'ValidationError')
      error = handleValidationErrorDB(error);
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();
    sendErrorForProduction(error, res);
  }
};
