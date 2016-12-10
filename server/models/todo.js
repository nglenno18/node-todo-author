var mongoose = require('mongoose');

var Todo = mongoose.model('Todo', {
  text: {
    type: String,
    required: true,
    minLength: 1,
    trim: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: {
    type: Number,
    default: null
  },
  //log the id of the USer object that Created it
  _creator:{
    //type is going to be an OBJECTID in a user from the db
    type: mongoose.Schema.Types.ObjectId,
    required: true
  }
});

module.exports = {Todo};
