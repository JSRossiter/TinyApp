const bcrypt = require('bcrypt');
const {generateRandomString} = require('../utils');
const users = {
  "test": {
    id: "test",
    email: "1@1",
    password: bcrypt.hashSync("1", 10)
  }
};

function findUserById (id) {
  return users[id];
}

function findUserByEmail(email) {
  return Object.values(users).find(u => u.email === email);
}

function createNewUser (email, password) {
  const userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };
  return users[userID];
}

function authenticateUser (email, password) {
  let user = findUserByEmail(email);
  if (user && bcrypt.compareSync(password, user.password)) {
    return user;
  } else {
    return;
  }
}

module.exports = {
  userService: {
    findUserByEmail,
    findUserById,
    createNewUser,
    authenticateUser
  }
};
