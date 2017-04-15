const express = require('express');
const router = express.Router();
const {urlService} = require('../services/url-services');
const {userService} = require('../services/user-services');

// if logged in send to /urls
function checkLogin (req, res, next) {
  if (userService.findUserById(req.session.userID)) {
    res.redirect("/urls");
    return;
  }
  next();
}

function newUser (req, res, next) {
  if(userService.findUserByEmail(req.body.email)) {
    next({status: 400, message: 'user already exists'});
    return;
  }
  req.app.locals.user = userService.createNewUser(req.body.email, req.body.password);
  req.session.userID = req.app.locals.user.id;
  next();
}

function login (req, res, next) {
  req.app.locals.user = userService.authenticateUser(req.body.email, req.body.password);
  if (req.app.locals.user) {
    req.session.userID = req.app.locals.user.id;
    next();
  } else {
    return next({status: 401, message: 'incorrect email or password'});
  }
}

function checkInput (req, res, next) {
  if (!req.body.email || !req.body.password) {
    return next({status: 400, message: 'missing email or password'});
  }
  next();
}

function checkSubmission (req, res, next) {
  if (req.session.longURL) {
    urlService.createURL(req.session.longURL, req.session.userID);
    req.session.longURL = null;
  }
  next();
}

router.route("/register")
  .get(checkLogin, (req, res) => {
    res.render("register");
  })
  .post(checkInput, newUser, checkSubmission, (req, res, next) => {
    res.redirect("/urls");
  });

router.route("/login")
  .get(checkLogin, (req, res) => {
    res.render("login");
  })
  .post(checkInput, login, checkSubmission, (req, res, next) => {
    if (req.body.path) {
      res.redirect(req.body.path);
    } else {
      res.redirect("/urls");
    }
  });

// logout
router.post("/logout", (req, res) => {
  req.session.userID = null;
  res.redirect("/");
});

module.exports = router;