const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const PORT = process.env.PORT || 8080; // default port 8080
const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "test": {
    id: "test",
    email: "1@1",
    password: bcrypt.hashSync("1", 10)
  }
}
const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    userID: "test"
  },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    userID: "test"
  },
  "9s11xK": {
    shortURL: "9s11xK",
    longURL: "http://www.notgoogle.com",
    userID: "nottest"
  }
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['f54gsrg46'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs")

// generates random 6 character alphanumeric string
function generateRandomString() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (var i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// filters urlDatabase by userID
function urlsForUser (userID) {
  output = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === userID) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
}

function findUser(email) {
  return Object.values(users).find(u => u.email === email);
}

// home page handler
app.get("/", (req, res) => {
  if (req.session.user_id) res.redirect("/urls");
  else res.render("landing_page");
});

// register
app.post("/register", (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    next({status: 409, message: 'missing email or password'});
    return;
  }
  if(findUser(req.body.email)) {
    next({status: 409, message: 'user already exists'});
    return;
  }
  userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  req.session.user_id = userID;
  res.redirect("/urls");
});

// login
app.post("/login", (req, res, next) => {
  if (!req.body.email || !req.body.password) {
    next({status: 409, message: 'missing email or password'});
    return;
  }
  let user = findUser(req.body.email);
  if (user && bcrypt.compareSync(req.body.password, user.password)) {
    req.session.user_id = user.id;
    res.redirect('/urls');
  } else {
    next({status: 409, message: 'bad credentials'});
  }
});

// logout
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// follow a link
app.get("/u/:shortURL", (req, res, next) => {
  // check if link is in database
  if (!urlDatabase[req.params.shortURL]) {
    next({status: 400, message: 'link not in database'});
    return;
  }
  res.redirect(301, urlDatabase[req.params.shortURL].longURL);
});

// TODO implement/test this
function checkLogin (req, res, next) {
  if (!req.session.user_id) {
    let templateVars = { user: users[req.session.user_id], path: req.path }
    res.status(401).render("require_login", templateVars);
    return;
    // return next({status: 401, message: 'login required'});
  }
  next();
}

// primary views
app.get("/urls", checkLogin, (req, res) => {
  let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", checkLogin, (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", checkLogin, (req, res) => {
  let templateVars = { user: users[req.session.user_id], shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.session.user_id] }
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.session.user_id] }
  res.render("login", templateVars);
});

// file requests
app.get("/public/:path/:name", (req, res) => {
  let fileName = req.params.name;
  let options = {
    root: __dirname + '/public/' + req.params.path,
    dotfiles: 'deny'
  }
  res.sendFile(fileName, options, (err) => {
    if(err) console.log(err);
  });
});

// require links to begin with http(s)
function addProtocol (req, res, next) {
  if (!req.body.longURL.match(/^http(s?):\/\//)) {
    req.body.longURL = "http://" + req.body.longURL;
  }
  next();
}

// create a link
app.post("/urls", checkLogin, addProtocol, (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: req.body.longURL,
    userID: req.session.user_id
  };
  res.redirect("/urls");
});

// update a link
app.post("/urls/:id", checkLogin, addProtocol, (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// delete a link
app.post("/urls/:id/delete", checkLogin, (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// TODO error handling > render a view
app.use((error, req, res, next) => {
  console.log(error);
  error.path = req.path;
  error.user = users[req.session.user_id];
  res.status(error.status).render("error", error);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});