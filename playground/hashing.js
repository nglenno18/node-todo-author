//INSTALL crypto-js@3.1.6 --save
const {SHA256} = require('crypto-js');  //crypto-js lib was for playground use only
//INSTALL jsonwebtoken@7.1.9 --save
const jwt = require('jsonwebtoken');
    //creates 2 functions:
        //One to create token, and one to verify it
var data = {
  id: 10
};

var token = jwt.sign(data, '123abc'); //value assigned to user when signed up or in
console.log(token);   //encrypted string that has data verifying if token data was Tampered
//TOKEN --> jwt.io

//jwt.verify; --> if the token is altered or SECRET is changed, throws JsonWebTokenError
var decoded = jwt.verify(token, '123abc');    //has to be the SAME secret
console.log(`\tDecoded: \t ${JSON.stringify(decoded)}`);
