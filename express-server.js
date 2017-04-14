const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require('cookie-session');

const {generateRandomString} = require('./utils');
const {userService} = require('./services/user-services');
const {urlService} = require('./services/url-services');
const urls = require('./routers/urls');
const login = require('./routers/login');

const PORT = process.env.PORT || 8080;

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ['its_a_secret'],

  // Cookie Options
  maxAge: 24 * 60 * 60 * 1000
}));
app.set("view engine", "ejs");

app.use(express.static('public'));
app.use((req, res, next) => {
  app.locals.user = userService.findUserById(req.session.user_id);
  next();
});
app.use("/urls", urls);
app.use(login);

// home page handler
app.route("/")
  .get((req, res) => {
    if (app.locals.user) {
      res.redirect("/urls");
    } else {
      res.render("landing_page");
    }
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

// follow a link
app.get("/u/:shortURL", (req, res, next) => {
  const url = urlService.getURL(req.params.shortURL);
  if (url) {
    if (!req.session.visitorId) {
      req.session.visitorId = generateRandomString();
    }
    urlService.trackView(url.shortURL, req.session.visitorId);
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