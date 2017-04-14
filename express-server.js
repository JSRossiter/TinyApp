const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session')

const {generateRandomString} = require('./utils');
const {userService} = require('./services/user-services');
const {urlService} = require('./services/url-services');
const urls = require('./routers/urls');

const PORT = process.env.PORT || 8080; // default port 8080

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['its_a_secret'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));
app.set("view engine", "ejs");
app.use(express.static('public'));

app.use((req,res,next) => {
  app.locals.user = userService.findUserById(req.session.user_id);
  next();
});

app.use("/urls", urls);

// if logged in send to /urls
function checkLogin (req, res, next) {
  if (app.locals.user) {
    res.redirect("/urls");
    return;
  }
  next();
}

function newUser (req, res, next) {
  if(userService.findUserByEmail(req.body.email)) {
    next({status: 409, message: 'user already exists'});
    return;
  }
  app.locals.user = userService.createNewUser (req.body.email, req.body.password);
  req.session.user_id = app.locals.user.id;
  next();
}

function login (req, res, next) {
  app.locals.user = userService.authenticateUser(req.body.email, req.body.password);
  if (app.locals.user) {
    req.session.user_id = app.locals.user.id;
    next();
  } else {
    return next({status: 409, message: 'incorrect email or password'});
  }
}

function checkInput (req, res, next) {
  if (!req.body.email || !req.body.password) {
    return next({status: 409, message: 'missing email or password'});
  }
  next();
}

function checkSubmission (req, res, next) {
  if (req.session.longURL) {
    urlService.createURL(req.session.longURL, req.session.user_id);
    req.session.longURL = null;
  }
  next();
}

// home page handler
app.route("/")
  .get((req, res) => {
    if (app.locals.user) res.redirect("/urls");
    else res.render("landing_page");
  })
  .post((req, res, next) => {
    if (!req.body.longURL) {
      res.redirect("/");
      return;
    } else {
      req.session.longURL = req.body.longURL;
      res.render("home_creation");
    }
  });

app.route("/register")
  .get(checkLogin, (req, res) => {
    res.render("register");
  })
  .post(checkInput, newUser, checkSubmission, (req, res, next) => {
    res.redirect("/urls");
  });

app.route("/login")
  .get(checkLogin, (req, res) => {
    res.render("login");
  })
  .post(checkInput, login, checkSubmission, (req, res, next) => {
    if (req.body.path) res.redirect(req.body.path);
    else res.redirect("/urls");
  });

// logout
app.post("/logout", (req, res) => {
  req.session.user_id = null;
  res.redirect("/");
});

// follow a link
app.get("/u/:shortURL", (req, res, next) => {
  const url = urlService.getURL(req.params.shortURL);
  if (url) {
    if (!req.session.visitor_id) req.session.visitor_id = generateRandomString();
    urlService.trackView(url.shortURL, req.session.visitor_id);
    res.redirect(302, url.longURL);
  } else {
    next({status: 404, message: 'link not in database'});
  }
});

app.use((error, req, res, next) => {
  console.log(error);
  error.path = req.path;
  error.user = app.locals.user;
  res.status(error.status).render("error", error);
});

app.listen(PORT, () => {
  console.log(`TinyApp listening on port ${PORT}!`);
});