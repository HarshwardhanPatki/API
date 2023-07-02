// Refactoring the code:
class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    const queryObj = { ...this.queryString }; // creating the hard copy if we only assign it to the variable the it will create a reference to that object and any changes made in the " queryObj " will be seen in " req.query ".
    // Thus by destructuring the object we create a hard copy of the object and by applying the curly braces we create the new object.
    const excludeFields = ['page', 'sort', 'limit', 'fields'];

    // removing all of the fields from the qurey object thus we iterate over the " excludeFields " array
    excludeFields.forEach((el) => delete queryObj[el]);

    // 1B: Advanced Filtering
    let queryString = JSON.stringify(queryObj);
    queryString = queryString.replace(
      /\b(gte|gt|lte|lt)\b/g,
      (match) => `$${match}`
    ); //" /\b(gte|gt|lte|lt)\b/g " this is the regular expression used to replace the filters appearing in the query , '\b' is used because we have to only match exact words, 'g' means that repalce operation will happen multiple time without 'g' it will replace only first occurance

    //console.log(JSON.parse(queryString));
    //console.log(req.query, queryObj);

    // similar to querying/filtering in mongodb
    // Build the Query
    this.query = this.query.find(JSON.parse(queryString));
    //let query = Tour.find(JSON.parse(queryString));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // if price sections are equal then we need other property on which we have to sort http://127.0.0.1:3000/api/v1/tours?sort=price,ratingsAverage so just add ',' and write other property.
      // now we have to jsut replace the ',' with ' '(space)
      const sortBy = this.queryString.sort.split(',').join(' ');
      //console.log(sortBy);

      //sort('price' 'ratingsAverage')
      this.query = this.query.sort(sortBy); // we can perform sort because tour.find() return a query so it can be chained in further before executing the query.
      // http://127.0.0.1:3000/api/v1/tours?sort=-price add minus sign for descending order
      // http://127.0.0.1:3000/api/v1/tours?sort=price for ascending order
    } else {
      // if not specified then we sort it by 'createdAt' you can use another property you wish
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      // select function takes parameters like select('name duration difficulty price') by using split and join we create the same string required for the select function.
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // showing the results without the __V property in the table
      this.query = this.query.select('-__v'); // '-' means it does not shows that columnwhile displaying the data, we are dispalying everything excluding '__v' column.
    }
    return this;
  }

  paginate() {
    // Because of sorting we can get different pagination data, but pagenation is working fine!!!
    // So if some problem occurs then just comment out the sort in the else part
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    //page=2&limit=10 , 1-10 page-1, 11-20 page-2,....
    // skip(10) means we are skipping the first 10 results , whwich will be starting from 11-20 i.e page-2.
    // question arises that why not directly ask user from the url the skip va;ue,we cannot because it is abstract to the user
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
