const express = require("express");
const app = express();
const PORT = process.env.PORT || 8080; // default port 8080
const bodyParser = require("body-parser");
const cookieParser = require('cookie-parser')

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());
app.set("view engine", "ejs")

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

// TODO home page handler
app.get("/", (req, res) => {
  res.redirect("/urls");
});

// login
app.post("/login", (req, res) => {
  res.cookie("username", req.body.username);
  res.redirect("/");
});

// logout
app.post("/logout", (req, res) => {
  res.clearCookie("username");
  res.redirect("/");
});

// follow a link
app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.params.shortURL];
  // TODO check if link in database
  // if (!longURL) {
  //   res.render("BAD_LINK")
  // }
  res.redirect(longURL);
});

// primary views
app.get("/urls", (req, res) => {
  let templateVars = { urls: urlDatabase, username: req.cookies["username"] };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = { username: req.cookies["username"] };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = { username: req.cookies["username"], shortURL: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

// create a link
app.post("/urls", (req, res) => {
  urlDatabase[generateRandomString()] = req.body.longURL;
  console.log(urlDatabase);
  res.redirect("/urls");
  // TODO force http(s)
});

// update a link
app.post("/urls/:id", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
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

// generates random 6 character alphanumeric string
function generateRandomString() {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (var i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}