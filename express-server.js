const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')
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
app.use(cookieParser());
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

// TODO home page handler
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// register
app.post("/register", (req, res) => {
  if (!req.body.email || !req.body.password) {
    res.status(400).send("Please complete both fields");
    return;
  }
  for (let id in users) {
    if (req.body.email === users[id].email) {
      res.status(400).send("This username is already in use");
      return;
    }
  }

  userID = generateRandomString();
  users[userID] = {
    id: userID,
    email: req.body.email,
    password: bcrypt.hashSync(req.body.password, 10)
  };
  console.log(users[userID].password);
  res.cookie("user_id", userID);
  res.redirect("/");
});

// login
app.post("/login", (req, res) => {
  for (id in users) {
    if (req.body.email === users[id].email) {
      if (bcrypt.compareSync(req.body.password, users[id].password)) {
        // login successful
        res.cookie("user_id", users[id].id)
        res.redirect("/");
        return;
      } else {
        res.status(403).send("Incorrect username or password");
        return;
      }
    }
  }
  res.status(403).send("Incorrect username or password");
  return;
});

// logout
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  res.redirect("/");
});

// follow a link
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL].longURL;
  // TODO check if link in database
  // if (!longURL) {
  //   res.render("BAD_LINK")
  // }
  res.redirect(longURL);
});

// primary views
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlsForUser(req.cookies.user_id), user: users[req.cookies.user_id] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  if (!req.cookies.user_id) {
    res.redirect("/login");
    return;
  }
  let templateVars = { user: users[req.cookies.user_id] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id], shortURL: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

app.get("/register", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] }
  res.render("register", templateVars);
});

app.get("/login", (req, res) => {
  let templateVars = { user: users[req.cookies.user_id] }
  res.render("login", templateVars);
});

// create a link
app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: req.body.longURL,
    userID: req.cookies.user_id
  };
  res.redirect("/urls");
  // TODO force http(s)
});

// update a link
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// delete a link
app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});