require('./config/config');

const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');

var {ObjectID} = require('mongodb');
var {mongoose} = require('./db/mongoose.js');
var {Todo} = require('./models/todo');
var {User} = require('./models/user');
var {authenticate}  = require('./middleware/authenticate');


//install express and bodyParser

var app = express();
const port = process.env.PORT;// || 3000;
console.log(port);

//MIDDLEWARE
app.use(bodyParser.json());

//POST requests
app.post('/todos', function(request, response){
  //console.log(request.body); //displays the POST request json body
  var newTodo = new Todo({
    text: request.body.text
  });

  newTodo.save().then(function(doc){
    console.log('--------------------------------------\nPOST /todos http request from POSTMAN ',
    '\n    - SHould ADD a NEW TODO to the mongoDB,\n       Display the new Todo: \n--------------------------------------');
    console.log(JSON.stringify(doc, undefined, 2));
    return response.send(doc);       //send the doc back to postman
  }, function(error){
    var m = 'Unable to create the Requested TODO: ';
    if(error.errors.text){
      m += error.errors.text.message;
      console.log(m);
      return response.status(400).send(m);
    }
    return response.status(400).send(error);     //send the error back to the POST request
  });
});

//GET requests
app.get('/todos', function(request, response){
  Todo.find().then(function(TodosList){
    console.log('--------------------------------------\nGET /todos http request from POSTMAN ',
    '\n\t- SHould RETURN ALL TODOS from mongoDB: \n--------------------------------------');
    console.log(TodosList);
    response.send({TodosList});
  }, function(fail){
    console.log(fail);
    response.status(400).send(fail);
  });
});


//5845c420f7cd89bc14f778d7
app.get('/todos/:id', function(request, response){
  //console.log(request.params);    //displays id inputted
  var requestedID = '';
  console.log(`\n\nRequested ID: `, request.params);
  if(!ObjectID.isValid(request.params.id)){
    var err = `ID(${request.params.id}) is NOT Valid ObjectID`;
    console.log(err);
    return response.status(404).send(err);
  }else {
    requestedID = request.params.id;
  }
  Todo.findById(requestedID).then(function(correctTodo){
    console.log('--------------------------------------\nGET /todos/:id http request for specific ID',
    '\n\t- SHould RETURN TODO w/ Specific ID from mongoDB: \n--------------------------------------');
    if(!correctTodo){
      var err = `ID(${request.params.id}) is MISSING from the USER Collection`;
      console.log(err);
      return response.status(404).send(err);
    }
    console.log(JSON.stringify(correctTodo, undefined, 2));
    return response.send({correctTodo});
  }, function(failedTodo){
    console.log(failedTodo);
    return response.status(400).send(failedTodo);
  });
});


//CREATE A DELETE route /////////////////////////////
app.delete('/todos/:id', function(request, response){
  //get the id
  var requestedID = ''; //new ObjectID(request.params.id);
  console.log(`\nREQUESTED ID: `, request.params.id);

  //validate the id --> not valid returns a 404
  if(!ObjectID.isValid(request.params.id)){
    console.log('**ID is NOT VALID**');
    return response.status(404).send('**Requested ID is NOT VALID**');
  }
  else{
    requestedID = new ObjectID(request.params.id);
    //remove todo by id
        //success --> if no doc, send 404
        //error --> 400 with empty body
    Todo.findByIdAndRemove(requestedID).then(function(deletedTodo){
      if(!deletedTodo){
        return response.status(404).send('ID missing from Todo Collection');
      }
      console.log(deletedTodo, '\n\t WAS DELETED FROM THE Todo Collection');
      return response.send({todo: deletedTodo});
    }).catch(function(error){
      response.status(400).send();
    });
  }
});

app.patch('/todos/:id', function(request, response){
  var id = request.params.id;
  //use lodash
  var body = _.pick(request.body, ['text', 'completed']);

  if(!ObjectID.isValid(id)){
    return response.status(404).send();
  }

  //Complex part of patch //
    //Checking a completed value and using that value to SEt a completedAt value
  if(_.isBoolean(body.completed) && body.completed){
    body.completedAt = new Date().getTime();
  } else {
    //if not a boolean or not true
    body.completed = false;
    body.completedAt = null;
  }

  Todo.findByIdAndUpdate(id, {$set: body}, {new: true})
      .then(function(todo){
        if(!todo){
          return response.status(404).send();
        }
        response.send({todo});
      }).catch(function(error){
        response.status(400).send(error);
      });
});

//------------------------------
app.post('/todos/post/', function(request, response){
  var newTodo = new Todo({
    _id: new ObjectID(),
    text: request.body.text
  });
  Todo.find({
    "text": newTodo.text
  }).then(function(todos){
    if(todos.length === 0){
      newTodo.save().then(function(doc){
        console.log(JSON.stringify(doc, undefined, 2));
        return response.send(doc);
      }, function(error){
        console.log(error);
        return response.status(400).send(error);
      });
    }else{
      console.log(todos[0].text);
      console.log('^^IS ALREADY IN THE DB');
      return response.status(404).send(`${todos[0].text} is ALREADY in the Todos DB`);
    }
  });

  console.log('BREAKKKKKKKKK\n\n\n');
});


//USERS -----------------------------------------------------------
//GET
app.get('/users', function(request, response){
  User.find().then(function(users){
    if(!users){
      console.log('No USERS in the USER COLLECTION');
      return response.status(400).send('No USERS in the USER COLLECTION');
    }
    return response.send(users);
  }, function(error){
    return response.status(400).send('No USERS in the USER COLLECTION');
  });
});


//POST-------------------------------------------------------------------------------
app.post('/users', function(request, response){
  //create user variable
  var body = _.pick(request.body, ['email', 'password']);
  var newUser = new User(body);

  newUser.save().then(function(doc){
    console.log(`\nNEW USER REQUEST: \n${doc}\n`);
    return newUser.generateAuthToken();
  }).then(function(token){
    //creating a custom header to store token value
      //becomes the jwt id to use later, found in Postman for now
    response.header('x-auth', token).send(newUser);
  })
  .catch(function(e){
    var m = '';
    //console.log(e);
    if(e.name === 'ValidationError'){
      if(e.errors.email){
        m = e.errors.email.message;
      }
      else if(e.errors.password){m = e.errors.password.message;}
    }
    else if(e.code && (e.code === 11000)){m = e.errmsg;}
    else{return response.status(401).send(e);}
    console.log(m);
    return response.status(400).send(m)
  });
});

//PRIVATEIZE ROUTES --> code for new MIDDLEWARE
    //**NOW located in './middlware/authenticate.js'

//Turn any one of our routes into a private route
app.get('/users/me', authenticate, function(request, response){
  response.send(request.user);
}); //need use seed data to test authenticate
    //route needs an x-auth token passed into it

//POST REQUEST to LOG IN
app.post('/users/login', function(request, response){
  var body = _.pick(request.body, ['email', 'password']);
  console.log(body.email);
  //VERIFY route is set up by using response.send(bodydata)
  User.findByCredentials(body.email, body.password)
  .then(function(user){
    //response.send(user);
    //CREATED the method to create new tokens for user
    //RETURN to keep chain alive
    return user.generateAuthToken().then(function(token){
      response.header('x-auth', token).send(user);
    });
  }).catch(function(e){
    console.log(e);
    response.status(400).send(`${e}`);
  });
});


//------------------------------------------------------
app.listen(port, function(){
  console.log(`Connected to server on port ${port}`);
});

module.exports = {app};
