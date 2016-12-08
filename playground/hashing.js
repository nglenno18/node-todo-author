//INSTALL crypto-js@3.1.6 --save
const {SHA256} = require('crypto-js');  //crypto-js lib was for playground use only
//INSTALL jsonwebtoken@7.1.9 --save
const jwt = require('jsonwebtoken');
//HASHING PASSWORDS --> Install bcryptjs@2.3.0 --save
const bcrypt = require('bcryptjs');

var password = '123abc!';

//Hash the password using bcrypt
bcrypt.genSalt(10, function(error, salt){
  bcrypt.hash(password, salt, function(err,hash){
    //WANT to store the HASH in our DB
    console.log(hash);
  });
});

//COMPARE this HASH with the PLAIN TEXT password (123abc!)
var hashedPassword = '$2a$10$q5JeLZBuYlojlrY.4xzr7us4OBOyDllAT6aJMHoIgHcBqi7HECYqu';
// bcrypt.compare('adsfasf', hashedPassword, function(error, result){
//   console.log(result);
// }); //WILL RETURN FALSE, plain text password is not the same
bcrypt.compare(password, hashedPassword, function(error, result){
  console.log(result);
});

// var data = {
//   id: 10
// };
//
// var token = jwt.sign(data, '123abc'); //value assigned to user when signed up or in
// console.log(token);   //encrypted string that has data verifying if token data was Tampered
//
// var decoded = jwt.verify(token, '123abc');    //has to be the SAME secret
// console.log(`\tDecoded: \t ${JSON.stringify(decoded)}`);
