//load objectId constructor functionc
const {ObjectID} = require('mongodb');
const {Todo} = require('./../../models/todo');
//----------USERS-----------------------------------------------------
const{User} = require('./../../models/user');
const jwt = require('jsonwebtoken');
const userOneID = new ObjectID();
const userTwoID = new ObjectID();

const usersArray = [{
  //_id: new ObjectID(),
  _id: userOneID,
  email: 'nglenno@gmail.com',
  password: 'userOnePass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id:userOneID, access: 'auth'}, 'secretValue').toString()
  }]
}, {
  _id: userTwoID,
  email: 'bradenjames@example.com',
  password: 'userTwoPass',
  tokens: [{
    access: 'auth',
    token: jwt.sign({_id:userTwoID, access: 'auth'}, 'secretValue').toString()
  }]
}];

//----------TODOS-----------------------------------------------------
const todosArray = [{
  _id: new ObjectID(),
  text: 'First test TODO example',
  _creator: userOneID
}, {
  _id: new ObjectID(),
  text: 'Second test todo',
  completed: true,
  completedAt: 333,
  _creator: userTwoID
}];

//function from the server.test beforeEach method
const populateTodos = function(done) {
  Todo.remove({}).then(() => {
    return Todo.insertMany(todosArray);
  }).then(()=>done());
};

//now populate the USer DB
    //insertMany WILL NOT run our middleware --> plain text password is stored, not HASHED
        //our tests assume password is HASHED
const populateUsers = function(done){
  User.remove({})
  .then(function(){
    var userOne = new User(usersArray[0]).save();
    var userTwo = new User(usersArray[1]).save();

    return Promise.all([userOne, userTwo])
  })
  .then(()=>done());
};
//export todosarray to use in server.test.js
module.exports = {
  todosArray,
  populateTodos,
  usersArray,
  populateUsers
};
