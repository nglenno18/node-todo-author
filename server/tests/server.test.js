const expect = require('expect');
const request = require('supertest');

const {ObjectID} = require('mongodb');
const {app} = require('./../server');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');

//TESTIN LIFE CYCLE METHOD
//SEED DATA --> 2 todo items in an array
//make up an array of dummy todos
const todosArray = [{
  _id: new ObjectID(),
  text: "First Test TODO example"
},{
  _id: new ObjectID(),
  text: "Second Test TODO example",
  completed: true,
  completedAt: 333
}];
//make sure db is empty before every run if you want to test Post/Todos,
//OR make sure db has dummy todosArray to test GET /todos
beforeEach(function(done){
  //Todo.remove({}).then(()=>done());
  Todo.remove({}).then(()=>{
    return Todo.insertMany(todosArray);
  }).then(()=> done());
});

// describe('POST /todos', function(){
//   //TEST CASE 1
//   it('Should create a new TODO', function(done){
//     var text = 'Test todo next text';
//     request(app)
//       .post('/todos')
//       .send({text})
//       .expect(200)
//       .expect(function(response){
//         expect(response.body.text).toBe(text);
//       })
//       //check what got stored
//       .end(function(error, response){
//         if(error){
//           return done(error);
//         }
//         //make request to db, fetching all the todos to make sure request was added
//         Todo.find({text}).then(function(todos){
//           expect(todos.length).toBe(1); //is 1 bc we always wipe db
//           expect(todos[0].text).toBe(text);
//           done();
//         }).catch((e)=>done(e));
//       });
//   });

//   //TEST 2
//   it('Should NOT create Todo w/ Invalid body data', function(done){
//     request(app)
//       .post('/todos')
//       .send({})
//       .expect(400)
//       .end(function(err, res){
//         if(err) return done(err);
//
//         Todo.find().then(function(todos){
//           expect(todos.length).toBe(2);     //is 0 bc we always wipe the db
//           done();
//         }).catch((e)=>done(e));
//       });
//   });
// });



  //DESCRIBE BLOCK
  describe('GET /todos', function(){
    it('Should get all TODOS', function(done){
      request(app)
        .get('/todos')
        .expect(200)
        .expect((res)=> { //success instead of todos, specified in server.js /Get /todos method
          expect(res.body.TodosList.length).toBe(2);
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
        .expect(200)
        .expect(function(response){
          expect(response.body.correctTodo.text).toBe(todosArray[0].text);
        })
        .end(done);
    });


    //CHALLENGE
    it('Should return a 404 if the TODO is not found', function(done){
      //make sure you get a 404 back
      request(app)
        .get(`/todos/5845c420f7cd89bc14f778d9`)
        .expect(404)
        .end(done);
    });

    it('Should return a 404 if the ID is not a VALIDE ObjectID', function(done){
      // /todos/123
      request(app)
        .get(`/todos/123`)
        .expect(404)
        .end(done);
    });
  });


  //DESCRIBE BLOCK for Delete Tests
  describe('DELETE /todos/:id', function(){
    it('Should remove a todo', function(done){
      var hexId = todosArray[1]._id.toHexString();   //delete the second item

      request(app)
        .delete(`/todos/${hexId}`)
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
          }).catch(function(error){
            done(error);
          });
        });
    });

    it('Should return 404 if todo is NOT found', function(done){
      var hexId = `58470263786f8ac433838fa3`; //ID is valid, but not found in collection

      request(app)
        .delete(`/todos/${hexId}`)
        .expect(404)
        .end(done);
    });

    it('Should return 404 if todo is NOT VALID', function(done){
      var hexId = `58470263786f8ac433838fa3333`; //ID is NOT valid

      request(app)
        .delete(`/todos/${hexId}`)
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
      var hexId = todosArray[0]._id.toHexString();
      console.log(hexId);
      var insertText = 'This is the substitute text that test should insert into the first Todo';
      request(app)
        .patch(`/todos/${hexId}`)
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

    it('Should Clear completedAt when Todo is NOT completed', function(done){
      //grab id of second todo item
      //update text, set completed to false
      //200
      //text changed, completed false, completedAt is null .toNotExist
      var secondID = todosArray[1]._id.toHexString();
      console.log(secondID);
      var textToInsert = 'This is a sub text to see if completedAt is cleared when completed value is false';
      request(app)
        .patch(`/todos/${secondID}`)
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
