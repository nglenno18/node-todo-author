var env = process.env.NODE_ENV || 'development'; //need to configure NODE_ENV in package.json
console.log(env,`***********`);
console.log(process.env.PORT);

if(env === 'development'){
  //set up mongodb URL
  console.log('\nenv = dev');
  process.env.PORT = 3000;  //remove the default below
  process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoDB';
}else if(env === 'test ' || env === 'test'){
  //set custom DB URL
  console.log('\nenv = test');
  process.env.PORT = 3000;
  process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoDbTest';
}

console.log(process.env.PORT);
