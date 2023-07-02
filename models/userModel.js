const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name'],
  },
  email: {
    type: String,
    validate: [validator.isEmail, 'Please provide a valid email'],
    required: [true, 'Please provide your Email Address'],
    unique: true,
    lowercase: true,
  },
  photo: {
    type: String,
  },
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guid', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please enter the Password'],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm the Password '],
    validate: {
      // This only works on CREATE and SAVE !!
      validator: function (pass) {
        // console.log(pass);
        return pass === this.password;
      },
      message: 'Passwords are not same',
    },
  },
  passwordChangedAt: {
    type: Date,
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
});

// Managing Passwords Using Pre Save Middleware (Always use the policy 'fat model thin controller')
userSchema.pre('save', async function (next) {
  // checking if the passsword filed in the newUser or existing user is modified or not, it may be the case that the password is not modified so at that time we do not have to perform any encryption on the password.
  // we have to perform only when the newUser is created or the password field is modifed.
  if (!this.isModified('password')) return next();

  // Hashing (Encrypting) Password using BCrypt
  // Hash the password with the cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // we dont want passConfirm field to persist in the database as it was only required to validate the passowrd so we are assigning it to undefined.
  // Delete the passwordConform Field
  this.passwordConfirm = undefined;
  next();
});

// Creating an instance method
// instace method is a basically a method that is going to be available in all documents of certain collection

// here we are passing both candidatePassword and userPassword because in the model we have made select:false in password field thus we cannot access the password using this.password, hence we need both candidatePassword and useraPassword if it wouldn't have been false then we would have just given the candidatePassword only.
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword); //return true if both passwords are same else false
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    // oncverting passwordChangedAt into milisecond format
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimestamp, JWTTimestamp);
    return JWTTimestamp < changedTimestamp; // if we change the password after the token is been issued the condition will be true thus it will return true else false
  }
  return false;
};

// it is not a JWT token we are generating a random token which is going to be send through the email, it is a random string, it needs to be crypted but not as strong as password hash.
// so we can use randomBytes function from crypto module
// we are going to send this to the uer. We should not store this resetToken in the database , (if the hacker get into the database he can change the password with the help of this resetToken instead of user doing the reset Password.)
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  console.log({ resetToken }, this.passwordResetToken);
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
