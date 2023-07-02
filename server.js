const mongoose = require('mongoose');
const dotenv = require('dotenv'); // to configure the environment variables install dotenv in express.

// Catching Uncaught Exceptions
// all the errors or bugs that occur in our synchoronous code but are not handled anywhere are called unhandled Exceptions
// when there is Uncaught Exception we really need to crash the application because there was an uncaught Exception the entire node process is in so-called unclean state, and to fix that the process needs to terminate and to be restarted.
process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('Uncaught Exception!! SHUTTING DOWN.....');
  // By doing server.close() we basically give the server the time to finish all the pending requests or being handled at the time and only then after that the server is basically killed
  server.close(() => {
    process.exit(1); //forcefully shutting down the application
  });
});

dotenv.config({ path: './config.env' }); // configuring it with node/express.
const app = require('./app');

// MongoDB Connectivity
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('DB connection successful'));

const port = 3000 || process.env.PORT;
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

// Errors outside Express Unhandled Rejections

// Handling all the unhandled rejections like if the DB is down , password is not matching(bad authentication) process creates the unhandledRejection object and we are using eventListners and eventHandlers on this event when occured in ordered to handle the errors. It can handle all the promise Rejections (global Handler)
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled Rejection!! SHUTTING DOWN.....');
  // By doing server.close() we basically give the server the time to finish all the pending requests or being handled at the time and only then after that the server is basically killed
  server.close(() => {
    process.exit(1); //forcefully shutting down the application
  });
});
