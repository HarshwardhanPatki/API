const express = require('express');
const tourController = require('./../controllers/tourController');
const router = express.Router();
const authController = require('./../controllers/authController');
//router.param('id', tourController.checkId);

// reading the file outside the callBack function outside it is only read once if we call inside it will execute again and again.
// JSON.parse() converts the string to JavaScript Object.
// JSON.stringify() converts the JavaScript object into String so that we can send it to server.

router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);
router.route('/monthly-plan/:year').get(tourController.getMonthlyPlan);

router
  .route('/')
  .post(tourController.createTour)
  .get(authController.protect, tourController.getAllTours);
// reading variables from the URL's using req.params
// we use '?' to define that the variable is optional (/api/v1/tours/:id/:x?/:y?)
router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

module.exports = router;
