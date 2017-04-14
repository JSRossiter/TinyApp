const bcrypt = require('bcrypt');
const {generateRandomString} = require('../utils');
const users = {
  "test": {
    id: "test",
    email: "1@1",
    password: bcrypt.hashSync("1", 10)
  }
}

function findUserById (id) {
  return users[id]
}

function createNewUser (email, password) {
  const user_id = generateRandomString();
  users[user_id] = {
    id: user_id,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  return users[user_id];
}

function authenticateUser (email, password) {
  let user = findUserByEmail(email);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  } else {
    return;
  }
}


function findUserByEmail(email) {
  return Object.values(users).find(u => u.email === email);
}

module.exports = {
  userService: {
    findUserByEmail,
    findUserById,
    createNewUser,
    authenticateUser
  }
}
