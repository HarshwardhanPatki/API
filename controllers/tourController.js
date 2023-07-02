//const fs = require('fs');
const Tour = require('./../models/tourModel');
const APIFeatures = require('./../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
// creating the middleware
// filling the search query part using the middleware ( aliasTopTours ) this will be implemented before getAllTours filling up the search query parameters
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summmary,difficulty';
  next();
};

// *********************************************************************************************************************

// const tours = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`) // .. means move out of that folder.
// );

// Writing Middlewares.

// exports.checkId = (req, res, next, val) => {
//   console.log(`Tour id: ${val}`);
//   if (val > tours.length) {
//     return res.status(404).json({
//       status: 'fail',
//       message: 'Invalid ID',
//     });
//   }
//   next();
// };

// middleware to check if the post request body has desired properties or not.

// exports.checkBody = (req, res, next) => {
//   console.log('inside the checkBOdy ....');
//   if (!req.body.hasOwnProperty('name') || !req.body.hasOwnProperty('price')) {
//     return res.status(400).json({
//       status: 'error',
//       message: 'Does not contains name or price property ......',
//     });
//   }
//   next();
// };
// *********************************************************************************************************************

// *********************************************************************************************************************
//exports.getAllTours = (req, res) => {
// console.log('inside the create tours....');
// const newId = tours[tours.length - 1].id + 1; // incrementing the id by 1.
// const newTours = Object.assign({ id: newId }, req.body); // combining two objects.
// tours.push(newTours);
// fs.writeFile(
//   `${__dirname}/../dev-data/data/tours-simple.json`,
//   JSON.stringify(tours),
//   (err) => {
//     res.status(201).json({
//       // status 201 means written in file or created...
//       status: 'success',
//       data: {
//         tours: newTours,
//       },
//     });
//   }
// );

/**********************************************************************************************************************
catching errors in asynchronous functions
asynchronous functions returns promises and if there is some error then the promise id rejected(or not fulfilled)
thus we can catch them using catch block
error generated from createTour is catch by the catchAsync



                                                THE FLOW OF THE ERROR

1: first we wrap the async function in the catchAsync which takes the async function as a parameter.
2: but it does not have access to the req,res,next parameters,the funtion should only avoke when the createTour reuest is made
3: it should return the function and not the result of the function, so we wrap it in the annonyms function and call the parameter 
   function.
4: the function after resolving either returns (successful,rejected) promise and that error is catch by the catch block
5: we are returning the function thus we can use the functin only when it is called.


********************************************************************************************************************* */
// request functions.
exports.getAllTours = catchAsync(async (req, res, next) => {
  // Getting all tours from the database.
  // Exexute the query
  // query at this time is like query.sort().select().skip().limit()
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  const tours = await features.query;

  // Send the Response
  res.status(200).json({
    status: 'success',
    results: tours.length,
    data: {
      tours: tours,
    },
  });
  //   try {
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.getTour = catchAsync(async (req, res, next) => {
  // Tour.findOne({ _id: req.params.id }) lower findByid is same as this query.
  const tour = await Tour.findById(req.params.id);

  // if the user enter the wrong id then it will give the null value when the promise gets reesolve
  // thus checking the null , if null then return the error.
  // as value is null but the promise is not rejected it is resolved thus we have to externally check for the value.
  // we are giving the parameter to the next(), thus express understands that this is an error so it skips all the middlewares and directly goes to the globalErrorHandling middleware for resolving the error.
  if (!tour) {
    return next(new AppError('No Tour Found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
  //   try {
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: err,
  //   });
  // }
});

exports.createTour = catchAsync(async (req, res, next) => {
  // Creating the tour in simpler way than previous way
  // const newTour = new Tour({ data });
  // newTour.save();

  // new Version/ way to create a document
  const newTour = await Tour.create(req.body);
  console.log(newTour);
  res.status(201).json({
    // status 201 means written in file or created...
    status: 'success',
    data: {
      tours: newTour,
    },
  });
  // try {
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err, // we have to properly create the error handling in order to display meaningful errors.
  //   });
  // }
});

exports.updateTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
    new: true, // because this way then the new updated document is the one that will be returned and since we want to send backupdated document to the client we always want this methodto actually return that new document.
    runValidators: true, // it is because of this that all the validators are running, if it was made false then mongoose accepts the invalid names or any other fields which are required in the schema when update request is made.
    // so we need a 'runValidators: true' that checks the validators implemented by the mongoose.
  });
  if (!tour) {
    return next(new AppError('No Tour Found with that ID', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      tour: tour,
    },
  });
  //   try {
  // } catch (err) {
  //   res.status(400).json({
  //     status: 'fail',
  //     message: err, // we have to properly create the error handling in order to display meaningful errors.
  //   });
  // }
});

exports.deleteTour = catchAsync(async (req, res, next) => {
  // Deleting the tour using Id
  const tour = await Tour.findByIdAndDelete(req.params.id);
  // check for the concept of !tour in getTour handler
  if (!tour) {
    return next(new AppError('No Tour Found with that ID', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null,
  });
  //   try {
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid Data Sent !!', // we have to properly create the error handling in order to display meaningful errors.
  //   });
  // }
});

// aggregation pipeline operators ( Stages )
// creating stats of all Tours
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        // _id: '$ratingsAverage',
        _id: { $toUpper: '$difficulty' },
        numTours: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      $sort: { avgPrice: 1 },
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } },
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats: stats,
    },
  });
  //   try {
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid Data Sent !!', // we have to properly create the error handling in order to display meaningful errors.
  //   });
  // }
});

// Aggregation Pipelining Unwinding and projecting
exports.getMonthlyPlan = catchAsync(async (req, res, next) => {
  const year = req.params.year * 1;
  const plan = await Tour.aggregate([
    {
      $unwind: '$startDates',
    },
    {
      $match: {
        startDates: {
          $gte: new Date(`${year}-01-01`),
          $lte: new Date(`${year}-12-31`),
        },
      },
    },
    {
      $group: {
        _id: { $month: '$startDates' },
        numTourStarts: { $sum: 1 },
        tours: { $push: '$name' },
      },
    },
    {
      $addFields: { month: '$_id' },
    },
    {
      $project: { _id: 0 },
    },
    {
      $sort: { numTourStarts: -1 },
    },
    {
      $limit: 12,
    },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      plan: plan,
    },
  });
  //   try {
  // } catch (err) {
  //   res.status(404).json({
  //     status: 'fail',
  //     message: 'Invalid Data Sent !!', // we have to properly create the error handling in order to display meaningful errors.
  //   });
  // }
});
