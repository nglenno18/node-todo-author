var {User} = require('./../models/user');

var authenticate = function(request, response, next){
  var token = request.header('x-auth');

  User.findByToken(token).then(function(user){
    if(!user){  //if there is a valid token, but could not find a match
      return Promise.reject();  //now function will auto stop and run the catch block instead
    }
    request.user = user;
    request.token = token;
    //need to call next, otherwise, GET /users/me route will never fire
    next();
  }).catch(function(e){
    response.status(401).send();
  });
};

module.exports = {authenticate};
