const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');

const {todosArray, populateTodos, usersArray, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

describe('POST /todos', function(){
  //TEST CASE 1
  it('Should create a new TODO', function(done){
    var text = 'Test todo next text';
    request(app)
      .post('/todos')
      .set('x-auth', usersArray[0].tokens[0].token)
      .send({text})
      .expect(200)
      .expect(function(response){
        expect(response.body.text).toBe(text);
      })
      //check what got stored
      .end(function(error, response){
        if(error){
          return done(error);
        }
        //make request to db, fetching all the todos to make sure request was added
        Todo.find({text}).then(function(todos){
          expect(todos.length).toBe(1); //is 1 bc we always wipe db
          expect(todos[0].text).toBe(text);
          done();
        }).catch((e)=>done(e));
      });
  });

  //TEST 2
  it('Should NOT create Todo w/ Invalid body data', function(done){
    request(app)
      .post('/todos')
      .set('x-auth', usersArray[0].tokens[0].token)
      .send({})
      .expect(400)
      .end(function(err, res){
        if(err){
          return done(err);
        }
        Todo.find().then(function(todos){
          expect(todos.length).toBe(2);     //is 0 bc we always wipe the db
          done();
        }).catch((e)=>done(e));
      });
  });
});


  //DESCRIBE BLOCK
  describe('GET /todos', function(){
    it('Should get all TODOS', function(done){
      request(app)
        .get('/todos')
        .set('x-auth', usersArray[0].tokens[0].token)
        .expect(200)
        .expect((res)=> { //success instead of todos, specified in server.js /Get /todos method
          console.log(res.body.TodosList);
          // expect(res.body.TodosList.length).toBe(2);
          expect(res.body.TodosList.length).toBe(1);  //only for the firstUser, not whole collection
        })
      .end(done);
    });
  });

  //DESCRIBE BLOCK To handle the specific ID requests
  describe('GET /todos/:id', function(){
    it('Should Get Specified TODO Doc', function(done){
      request(app)
        // .get(`/todos/:id`)
        // .get(`/todos/${todos[0]._id}`) --> need to convert ObjectID to string
        .get(`/todos/${todosArray[0]._id.toHexString()}`)
        //UPDATE: --> we know that the first todo we just got belongs to the first user
        .set('x-auth', usersArray[0].tokens[0].token)
        .expect(200)
        .expect(function(response){
          expect(response.body.correctTodo.text).toBe(todosArray[0].text);
        })
        .end(done);
    });

    it('Should return a 404 if the TODO is not found', function(done){
      //make sure you get a 404 back
      request(app)
        .get(`/todos/5845c420f7cd89bc14f778d9`)
        .set('x-auth', usersArray[0].tokens[0].token)          //BUT be logged in as the wrong user
        .expect(404)
        .end(done);
    });

    it('Should return a 404 if the ID is not a VALIDE ObjectID', function(done){
      // /todos/123
      request(app)
        .get(`/todos/123`)    //NOT a valid user ID
        .set('x-auth', usersArray[0].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('Should NOT return a TODO doc created by another USER', function(done){
      //make sure you get a 404 back
      var todoID = todosArray[0]._id.toHexString();
      request(app)
        // .get(`/todos/5845c420f7cd89bc14f778d9`)
        .get(`/todos/${todoID}`)                  //get a real TODO from first user
        .set('x-auth', usersArray[1].tokens[0].token)        //BUT be logged in as the 2nd user
        .expect(404)
        .end(done);
    });
  });


  //DESCRIBE BLOCK for Delete Tests
  describe('DELETE /todos/:id', function(){
    it('Should remove a todo', function(done){
      //Trying to REMOVE the SECOND TODO (belongs to User 2)
      var hexId = todosArray[1]._id.toHexString();   //delete the second item

      request(app)
        .delete(`/todos/${hexId}`)
        .set('x-auth', usersArray[1].tokens[0].token)   //authenticated as 2nd User
        .expect(200)
        .expect(function(response){
          expect(response.body.todo._id).toBe(hexId);
        })
        .end(function(error, response){
          if(error){
            return done(error);   //pass in error to be handled by mocha
          }
          //query database using findById using toNotExist
          Todo.findById(hexId).then(function(todo){
            expect(todo).toNotExist();
            done();
          }).catch((e) => done(e));
        });
    });

    it('Should NOT remove a TODO that belongs to another USER', function(done){
      //Trying to REMOVE the SECOND TODO (belongs to User 2)
      //LOGIN as WRONG USER
      var hexId = todosArray[0]._id.toHexString();   //delete the FIRST item

      request(app)
        .delete(`/todos/${hexId}`)
        .set('x-auth', usersArray[1].tokens[0].token)   //authenticated as 2nd User
        .expect(404)
        .end(function(error, response){
          if(error){
            return done(error);   //pass in error to be handled by mocha
          }
          //query database using findById using toNotExist
          Todo.findById(hexId).then(function(todo){
            expect(todo).toExist();   //DELETION should never have happend, so it should still be there
            done();
          }).catch((e) => done(e));
        });
    });

    it('Should NOT remove a TODO, return 404 if todo is NOT found', function(done){
      var hexId = `58470263786f8ac433838fa3`; //ID is valid, but not found in collection
      request(app)
        .delete(`/todos/${hexId}`)
        .set('x-auth', usersArray[1].tokens[0].token)
        .expect(404)
        .end(done);
    });

    it('Should NOT remove a TODO, return 404 if todo is NOT VALID', function(done){
      var hexId = `58470263786f8ac433838fa3333`; //ID is NOT valid

      request(app)
        .delete(`/todos/${hexId}`)
        .set('x-auth', usersArray[1].tokens[0].token)
        .expect(404)
        .end(done);
    });
  });

  //DEXCRIBE BLOCK for patch routes
  describe('PATCH /todos/:id', function(){
    it('Should Update the todo', function(done){
      //grab id of first item..make patch request, provide proper url w/ id
      //update text and set completed = true
      //200 back
      //response body has a text property equal to what you set, completed is true,
          //and completedat is a number .toBeA
      var hexId = todosArray[0]._id.toHexString();  //FIRST TODO
      console.log(hexId);
      var insertText = 'This is the substitute text that test should insert into the first Todo';
      request(app)
        .patch(`/todos/${hexId}`)
        .set('x-auth', usersArray[0].tokens[0].token)
        .send({
          completed: true,
          text: insertText
        })
        .expect(200)
        .expect(function(response){
          expect(response.body.todo.text).toBe(insertText);
          expect(response.body.todo.completed).toBe(true)
          expect(response.body.todo.completedAt).toBeA('number');
        })
        .end(done);
    });

    it('Should NOT update another Users TODO (Does not have authentication)', function(done){
      var hexId = todosArray[0]._id.toHexString();  //FIRST TODO
      console.log(hexId);
      var insertText = 'This text should not be able to be inputted, User does not have authority';
      request(app)
        .patch(`/todos/${hexId}`)
        .set('x-auth', usersArray[1].tokens[0].token) //login as WRONG USER
        .send({
          completed: true,
          text: insertText
        })
        .expect(404)
        .end(done);
    });

    it('Should Clear completedAt when Todo is NOT completed', function(done){
      //grab id of second todo item
      //update text, set completed to false
      //200
      //text changed, completed false, completedAt is null .toNotExist
      var secondID = todosArray[0]._id.toHexString();
      console.log(secondID);
      var textToInsert = 'This is a sub text to see if completedAt is cleared when completed value is false';
      request(app)
        .patch(`/todos/${secondID}`)
        .set('x-auth', usersArray[0].tokens[0].token)
        .send({
          completed: false,
          text: textToInsert
        })
        .expect(200)
        .expect(function(response){
          expect(response.body.todo.text).toBe(textToInsert);
          expect(response.body.todo.completed).toBe(false);
          expect(response.body.todo.completedA).toNotBe('number')
        })
        .end(done);
    });
  });


  //---------------------------------------------------------------
  //--------------------TEST the SEED DATA in USERS----------------
  describe('GET /users/me', function(){
    //test when it has a VALID auth token
    it('Should return User IF authenticated Valid token is provided', function(done){
      request(app)
        .get('/users/me')
        //SET A HEADER valued from the token value inside the first user
        .set('x-auth', usersArray[0].tokens[0].token)
        .expect(200)
        .expect(function(response){
          expect(response.body._id).toBe(usersArray[0]._id.toHexString());
          expect(response.body.email).toBe(usersArray[0].email);
        })
        .end(done);
    });
    //test when it is missing a token
    it('Should return a 401 if User is NOT Validated (wrong/invalid TOKEN)', function(done){
      request(app)
        .get('/users/me')
        //.set()
        .expect(401)
        .expect(function(response){
          //expect that the response body is empty, no user ObjectID
          expect(response.body).toEqual({});
        })
        .end(done);
    });
  });//end describe block

  //TEST CASES for the SIGNUP route
  describe('POST /users', function(){
    it('Should CREATE a User (Valid data)', function(done){
      var email = 'fakebutVALID@email.com';
      var password = '123Pass';
      request(app)
        .post('/users')
        .send({email, password})
        .expect(200)
        .expect(function(response){
          expect(response.headers['x-auth']).toExist();
          expect(response.body.email).toBe(email);
          expect(response.body._id).toExist();
        })
        .end(function(err){
          if(err){
            return done(err);
          }
          User.findOne({email}).then(function(user){
            expect(user).toExist();
            expect(user.password).toNotBe(password); //bc it is hashede,not plain text
            done();
          }).catch((e) => done(e));
        });
    });

    it('Should Return a VALIDATION ERROR if the EMAIL is INVALID', function(done){
      var email = 'fake and invalid email@i.com';
      var password = 'validPassword';
      request(app)
        .post('/users')
        .send({email, password})
        .expect(400)
        .end(done);
    });
    it('Should Return a VALIDATION ERROR if the PASSWORD is INVALID', function(done){
      var email = 'fakeDemail@i.com';
      var password = 'not';
      request(app)
        .post('/users')
        .send({email, password})
        .expect(400)
        .end(done);
    });

    it('Should NOT create User if EMAIL is VALID, but TAKEN (Duplicate Email Error)', function(done){
      var email = usersArray[0].email;
      var password = 'validPassword';
      request(app)
        .post('/users')
        .send({email, password})
        .expect(400)
        .end(done);
    });
  });//end describe block for SIGN UP ROUTE


  //DESCRIBE BLOCK for USER Login POST ROUTES
  describe('POST /users/login', function(){
    it('Should LOGIN user and return AUTH Token', function(done){
      //need seed data
      request(app)
        .post('/users/login')
        .send({
          email: usersArray[1].email,
          password: usersArray[1].password
        })
        .expect(200)
        //expect that the response header has anx-auth Token
        .expect(function(response){
          expect(response.headers['x-auth']).toExist();
        })
        .end(function(error, response){
          if(error){
            return done(error);
          }
          User.findById(usersArray[1]._id).then(function(user){
            // expect(user.tokens[0]).toInclude({
            expect(user.tokens[1]).toInclude({ //added tokens to 2nd user
              access: 'auth',
              token: response.headers['x-auth']
            });
            done();
          }).catch((e) => done(e));   //ESSENTIAL TO get a descripted error message
        });
    });

    it('Should REJECT and INVALID LOGIN', function(done){
      request(app)
        .post('/users/login')
        .send({
          email: usersArray[1].email,
          password: 'wrongPassword'
        })
        .expect(400)
        .expect(function(response){
          expect(response.headers['x-auth']).toNotExist();
        })
        .end(function(error, response){
          if(error){ return done(error);}
          User.findById(usersArray[1]._id).then(function(user){
            expect(user.tokens.length).toBe(1); //added tokens to 2nd user
            done();
          }).catch((e)=>done(e));
        });
    });

  });//end DESCRIBE BLOCK to TEST Login POST ROUTES

  //LOG OUT Testing
  describe('DELETE /users/me/token', function(){
    it('Should REMOVE a VALID TOKEN from a current User Token collection', function(done){
      var sampleToken = usersArray[0].tokens[0].token;
      console.log('Sample Token\n\t', sampleToken);

      //FIRST, set the x-auth to the sampleToken, ASSERT a 200
      request(app)
        .delete(`/users/me/token`)
        //SET the x-auth token = to sampleToken
        .set('x-auth', sampleToken)
        .expect(200)
        //add an ASYNCHRONOUS .end() call to make an ASSERTION after the TOKEN is set
        .end(function(error, response){
          if(error){return done(error);}
          //find the user and verify the tokens array is one less (0)
          User.findById(usersArray[0]._id).then(function(user){
            expect(user.tokens.length).toBe(0);
            done();
          }).catch((e)=>done(e));
        });
    });
  });//end Describe {} TESTING LOG OUT delete routes
