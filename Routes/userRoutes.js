const express = require('express');
const authController = require('./../controllers/authController');
const userController = require('./../controllers/userController'); //importing the modules..
const router = express.Router();
// app.route is also a type of middleware.
// middle wares are the function which are perormed in between request and response cycle.
// function(req,res,next) {} always call the next function at the end of the middleware function.

// Routers
// creating different routers for each tours,users,etc.
// we are going to separate this file into different files inorder to maintain the readibility of the code.

// statsu 500 means internal server error.
router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgetPassword', authController.forgetPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

router
  .route('/')
  .get(userController.getAllUsers)
  .post(userController.createUser);
router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
