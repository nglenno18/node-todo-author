var mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');

var UserSchema = new mongoose.Schema({
    email: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      unique: true,
      validate: {
        validator: validator.isEmail,
        message: `{VALUE} is not a valid email `
      }
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    tokens: [{
      access: {
        type: String,
        required: true
      },
      token: {
        type: String,
        required:true
      }
    }]
});

//OVERRIDE a method to restrict what properties of the User mongoose model when it is converted to a json value Objec
UserSchema.methods.toJSON = function(){
  var user = this;
  var userObject = user.toObject();

  //import lodash --> need to use pick method to pick which data is returned to user
  return _.pick(userObject, ['_id', 'email']);
};

//Created method
UserSchema.methods.generateAuthToken = function(){
  var user = this;  //ARROW Function does not bind 'this' keyword
  //Need ACCESS value and TOKEN value in order to create NEW token inside of document
  var access = 'auth';
  var token = jwt.sign(
    {_id: user._id.toHexString(), access},
    'secretValue').toString();

  user.tokens.push({access, token});

  return user.save().then(function(){
    return token;
    })
    //.then(function(token){  -->chain this later in server.js
    //then statement will happen in server.js, in order to allow server.js to CHAIN onto
      //the promise, we need save to be returned
      //that returned value will be passed as the success argument for the next 'then' call
};

var User = mongoose.model('User', UserSchema);

module.exports = {User};
