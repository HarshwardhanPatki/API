const express = require('express');
const morgan = require('morgan');
const tourRouter = require('./Routes/tourRoutes');
const userRouter = require('./Routes/userRoutes');
const appAppError = require('./utils/appError');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const app = express();

// In Node.js, app.use(express.json()) is a middleware function that is used to parse incoming JSON requests and puts the parsed data in req.body1. It is used to set up middleware for your application2. The express.json() function is built-in middleware function in Express starting from v4.16.01.
// Middleware functions are functions that have access to the request object (req), the response object (res), and the next middleware function in the application’s request-response cycle1. They can execute any code, make changes to the request and the response objects, end the request-response cycle, and call the next middleware function in the stack1.

// middlewares
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());

// The express.static() middleware function is a built-in middleware function in Express that serves static files and is based on serve-static1. It takes one argument which is the root directory from which to serve static assets1. It returns an object1.
app.use(express.static(`${__dirname}/public`));

// app.use((req, res, next) => {
//   console.log('Hello from 3rd middleware');
//   next();
// });

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  console.log(req.headers);
  next();
});
// v1 here denotes the version of the application it prevents the breakage of the code. Even if we update the version those who have not installed the newer version can still be able to use the application. Its a good practice to write the version in url.

// Writing all the route functions

app.use('/api/v1/tours', tourRouter); // it is a middleware
app.use('/api/v1/users', userRouter);

// as middlewares work in the order, if the control reaches this point then sure it didnt hit any url, so we are writing the handler to handle the remaining url.
app.all('*', (req, res, next) => {
  // const err = new Error(`Can't find ${req.originalUrl} on the server`);
  // err.status = 'fail';
  // err.statusCode = 404;
  // next(err); // if we pass an argument to the next() middleware express asumes that it is an error , it skips all the other middlewares and send it to the global error handling middleware.
  next(new AppError(`Can't find ${req.originalUrl} on the server`, 404));
});

//implementing global error handling middleware, will catch all the errors from entire project
app.use(globalErrorHandler);

// Listening to the port......
module.exports = app;
