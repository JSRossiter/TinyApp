const express = require('express');
const methodOverride = require('method-override');

const {urlService} = require('../services/url-services');

const router = express.Router();

router.use(methodOverride('_method'));

function requireLogin (req, res, next) {
  if (!req.session.user_id) {
    let templateVars = { user: null, path: `/urls${req.path}` }
    res.status(401).render("require_login", templateVars);
    return;
  }
  next();
}

function checkAccess (req, res, next) {
  if (!urlService.checkAccess(req.params.shortURL, req.session.user_id)) {
    return next({status: 403, message: 'you do not have access to this url'});
  } else next();
}

// check if link is in database
function checkLink (req, res, next) {
  if (!urlService.getURL(req.params.shortURL)) {
    next({status: 404, message: 'link not in database'});
    return;
  }
  next();
}

router.use(requireLogin);

router.route("/")
  .get((req, res) => {
    res.render("urls_index", { urls: urlService.urlsForUser(req.session.user_id) });
  })
  // create a link
  .post((req, res) => {
    urlService.createURL(req.body.longURL, req.session.user_id);
    res.redirect("/urls");
  });

router.get("/new", (req, res) => {
  res.render("urls_new");
});

router.route("/:shortURL")
  .all(checkLink, checkAccess)
  .get((req, res, next) => {
    res.render("urls_show", { url: urlService.getURL(req.params.shortURL) });
  })
  // update a link
  .put((req, res) => {
    urlService.editURL(req.params.shortURL, req.body.longURL);
    res.redirect("/urls");
  })
  // delete a link
  .delete((req, res) => {
    urlService.deleteURL(req.params.shortURL);
    res.redirect("/urls");
  });

module.exports = router;