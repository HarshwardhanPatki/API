const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const sendEmail = require('./../utils/email');

const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // const newUser = await User.create(req.body); if we had written like this then it would have been a threat,means that we are creating the user with all the POST DATA , anyone can become an admin if we created user using this code.
  // instead we are assigning only the part of the data that we want inorder to make newUser. Even if the user manually try to insert a role it will not be stored in the newUser.
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const token = signToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token: token, // sending the token created back to the client
    data: {
      user: newUser,
    },
  });
});

// Logging in Users
exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body; // object destructuring
  // 1: check if email and password exists
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }
  // 2: check if user exists and password is correct
  const user = await User.findOne({ email: email }).select('+password'); // '+' is used to show the field that is marked as fasle in the model.

  // we are checking first if the user exists or not , if user does not exist then the block will be executed and will not check for the result of the await function.
  // if user is present and password is invalid/does not matches then the block will get executed.
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401)); // 401 means unauthorize
  }
  // 3: If everything ok, then send token to client
  const token = signToken(user._id);
  res.status(200).json({
    status: 'success',
    token: token,
  });
});

// creating middleware to protect getAllTours only logged users can acesse this route
exports.protect = catchAsync(async (req, res, next) => {
  // 1: get token and check if it exists
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }
  // console.log(token);
  if (!token) {
    return next(
      new AppError('You are not logged in! Please login to get access', 401)
    );
  }
  // 2: validate tokens (verification)
  // checking if the token payload is not been modified by the third Party.
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // console.log(decoded);

  // 3: check if user trying to access route still exists
  // what if the user has been deleted in  the meantime so the token will still exists, but if the user is no longer existent well then we actually don't want to log him in.
  // or even worse what if the user has actually changed his password after the token has been issued, that should also not work
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError(
        'The user belonging to this Token does no longer Exists.',
        401
      )
    );
  }

  // 4: check if user change password after JWT was issued
  if (currentUser.changePasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changedp password please login again', 401)
    );
  }

  // grant access to protected route
  req.user = currentUser;
  next();
});

//Authorization User and Roles Permissions
// we are using closure because we cannot take arguments in middlewares so we are making a closure that will take all the arguments and spread operator is used in order to transform it into the array roles.
// if it does not contains the role we mention in the tourRoute then we give the 403 - Forbidden Error.
// we are accessing the role of the user from the req.user object that we store through the previous middleware
exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // Roles is an array ['admin','lead-guid']
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have the permission to perform the action',
          403
        )
      );
    }
    next();
  };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
  // 1: get user based on posted email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with that email address', 404));
  }
  // 2: Generate the random token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });
  // 3: Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;
  console.log(resetURL);
  // creating the message
  const message = `Forget your password submit a patch request with your new password and confirmPassword to : ${resetURL}./\n If you didn't forget your password, please ignore the email!`;

  // handling the error in case of send Email, then we have to reset the token and expiry Date of the Token
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message: message,
    });
    res.status(200).json({
      status: 'success',
      message: 'Token send to the email!',
    });
  } catch (err) {
    user.createPasswordResetToken = undefined;
    user.passwordResetExpires = undefined;
    // saving it in the DB
    await user.save({ validateBeforeSave: false });
    return next(
      new AppError('There was an error sending the email.Try again Later!'),
      500
    );
  }
});

exports.resetPassword = (req, res, next) => {};
