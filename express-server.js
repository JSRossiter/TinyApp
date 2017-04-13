const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
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
  "b2xy52": {
    shortURL: "b2xy52",
    longURL: "http://www.lighthouselabs.ca",
    userID: "test",
    totalViews: 0,
    uniqueViews: 0,
    viewLog: [{
      timestamp: 1492038283873,
      visitor_id: "g56egr"
      }]
  },
  "9sm99K": {
    shortURL: "9sm99K",
    longURL: "http://www.google.com",
    userID: "test",
    totalViews: 0,
    uniqueViews: 0,
    viewLog: [{
      timestamp: 1492038283879,
      visitor_id: "85mjgr"
      }]
  }
};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['f54gsrg46'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs");
app.use(methodOverride('_method'));
app.use(express.static('public'));


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

// require links to begin with http(s)
function addProtocol (req, res, next) {
  if (!req.body.longURL.match(/^http(s?):\/\//)) {
    req.body.longURL = "http://" + req.body.longURL;
  }
  next();
}

// check if link is in database
function checkLink (req, res, next) {
  if (!urlDatabase[req.params.shortURL]) {
    next({status: 400, message: 'link not in database'});
    return;
  }
  next();
}

// update view log and counters
function trackView (req, res, next) {
  let shortURL = req.params.shortURL;
  if (!req.session.visitor_id) {
    req.session.visitor_id = generateRandomString();
  }
  let log = urlDatabase[shortURL].viewLog;
  let test = false;
  for (var i = 0; i < log.length; i++) {
    if (log[i].visitor_id === req.session.visitor_id) test = true;
  }
  if (!test) urlDatabase[shortURL].uniqueViews += 1;
  urlDatabase[shortURL].totalViews += 1;
  urlDatabase[shortURL].viewLog.push({
    timestamp: Date.now(),
    visitor_id: req.session.visitor_id
  })
  next();
}

// home page handler
app.get("/", (req, res) => {
  if (req.session.user_id) res.redirect("/urls");
  else res.render("landing_page");
});

// logout
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/");
});

// follow a link
app.get("/u/:shortURL", checkLink, trackView, (req, res) => {
  res.redirect(302, urlDatabase[req.params.shortURL].longURL);
});

function checkLogin (req, res, next) {
  if (!req.session.user_id) {
    let templateVars = { user: null, path: req.path }
    res.status(401).render("require_login", templateVars);
    return;
  }
  next();
}

app.get("/urls/new", checkLogin, (req, res) => {
  let templateVars = { user: users[req.session.user_id] };
  res.render("urls_new", templateVars);
});

app.route("/urls")
  .get(checkLogin, (req, res) => {
    let templateVars = { urls: urlsForUser(req.session.user_id), user: users[req.session.user_id] };
    res.render("urls_index", templateVars);
  })
  // create a link
  .post(checkLogin, addProtocol, (req, res) => {
    let shortURL = generateRandomString();
    urlDatabase[shortURL] = {
      shortURL: shortURL,
      longURL: req.body.longURL,
      userID: req.session.user_id,
      totalViews: 0,
      uniqueViews: 0,
      viewLog: []
    };
    res.redirect("/urls");
  });

app.route("/urls/:id")
  .get(checkLogin, (req, res) => {
    let templateVars = {
      user: users[req.session.user_id],
      url: urlDatabase[req.params.id]
    };
    res.render("urls_show", templateVars);
  })
  // update a link
  .put(checkLogin, addProtocol, (req, res) => {
    urlDatabase[req.params.id].longURL = req.body.longURL;
    res.redirect("/urls");
  })
  // delete a link
  .delete(checkLogin, (req, res) => {
    delete urlDatabase[req.params.id]
    res.redirect("/urls");
  });

app.route("/register")
  .get((req, res) => {
    let templateVars = { user: users[req.session.user_id] }
    res.render("register", templateVars);
  })
  .post((req, res, next) => {
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

app.route("/login")
  .get((req, res) => {
    let templateVars = { user: users[req.session.user_id] }
    res.render("login", templateVars);
  })
  .post((req, res, next) => {
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