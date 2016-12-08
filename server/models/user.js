var mongoose = require('mongoose');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const bcrypt = require('bcryptjs');


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
  });
};

UserSchema.statics.findByToken = function(token){
  //verify
  var User = this;    //MODEL method binded with this keyword
  var decoded;
  try{
    decoded = jwt.verify(token, 'secretValue');
  }catch(e){
    return Promise.reject();
  }
  //find user'
  return User.findOne({
    '_id': decoded._id,
    //Query a NESTED object (find a user whos token array has an object where the token prop = our token prop)
    'tokens.token': token,
    'tokens.access': 'auth'
  });
};
//attach an event to schema --> userschema.pre runs code BEFORE an event, event is saved,
    //and then the code is ran.
    //next() call is when the data is ACTUALLY saved to the DB
    //WE will be hashing the PASSWORD inside of the caqllback
UserSchema.pre('save', function(next){
  //access to the indiv doc
  var user = this;

  //check if password was modified
  //user.isModified('password') //takes indiv property and return true or false
  if(user.isModified('password')){ //LOAD in our calls
    //call to genSalt
    bcrypt.genSalt(10, function(error, salt){
      bcrypt.hash(user.password, salt, function(err,hash){
        //WANT to store the HASH in our DB
        console.log(hash);
        user.password = hash;
        next();
      });
    });
    //call to hash
  }else {
    next();
  }
}); //STORES A HASHED password instead of a normal plain text

var User = mongoose.model('User', UserSchema);

module.exports = {User};
