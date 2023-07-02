const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');
// creating schemas using mongoose
// creating the blue Print of the model and applying some validations like required,unique,default,ect
const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name'], // it specifies that it is required and if not allocated that property then it will display the message
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have less than or equal to 40 characters',
      ], // validators on the string in-built validators.
      minlength: [
        10,
        'A tour name must have more than or equal to 10 characters',
      ], // validators on the string in-built validators.
      // validate: [
      //   validator.isAlpha,
      //   'Tour name must only contain the characters',
      // ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a  difficulty'], // this is the shortform for the below enum object
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either : easy , medium , difficult',
      }, // it can be used only for the strings
    },
    ratingsAverage: {
      type: Number,
      default: 4.5, // we can assign default values also if not specified then it is assigned to 4.5
      min: [1, 'rating must be above 1.0'], // minimum rating should be above 1.0 (in-built validators)
      max: [5, 'rating must be below 5.0'], // maximum rating should be less than pr equal to 5.0 (in-built validators)
      // min max also works on the dates.
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price'],
    },
    priceDiscount: {
      type: Number,
      //Building one's own custom validators
      validate: {
        validator: function (val) {
          //val === price discount that user inputted
          // this only points to the current doc on NEW document creation.
          return val < this.price;
          // in validators 'this' keyword only points to the current document. So this function is not going to work on the update
          // priceDiscount should be less than the original price
          // if true then no problem, if false then triggers the validation errors
        },
        message: 'Discount price ({VALUE}) should be below the regular price',
      },
    },
    summary: {
      type: String,
      trim: true, // only used with strings used to remove whitespaces at start and the end
      required: [true, 'A tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a image cover'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false, // (PERMANENTLY HIDING FROM THE OUTPUT) This means we are not able to show this column as it can contain some valuable info, we can do same with username,password column if present in the schema.(its a good practice)
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

//In Mongoose, a virtual is a property that is not stored in MongoDB. Virtuals are typically used for computed properties on documents.
// cannot use virtual property in query because they are not present in the database
tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// using middlewares in mongoose Mongoose has 4 types of middleware: document middleware, model middleware, aggregate middleware, and query middleware.
// This is DOCUMENT MIDDLEWARE: runs before .save() and .create() only and not on .insertMany()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourSchema.pre('save', function (next) {
//   console.log('Will save the document....');
//   next();
// });

// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// 2: QUERY MIDDLEWARE
// in this middleware 'this' keywaord will be referencing to the query and not the document
// 'this' is now a query object so now we can chain the query object
//tourSchema.pre('find', function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.post(/^find/, function (docs, next) {
  console.log(`Query took ${Date.now() - this.start} miliseconds!`);
  // console.log(docs);
  next();
});

// 3: AGGREGATION MIDDLEWARE
// 'this' in this middleware refers to the current aggregation object
tourSchema.pre('aggregate', function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } }); // pushes the $match at the begining of the array.
  //removing from the documents all the tours that have secretTours true
  console.log(this.pipeline()); // refers to the aggregate pipeline object
  next();
});

// creating a model
const Tour = mongoose.model('Tour', tourSchema); // we created Tour so our Table in the database was named tours (always gives plural names to the collections)

module.exports = Tour;
