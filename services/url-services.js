const {generateRandomString} = require('../utils');
const urlDatabase = {
  "b2xy52": {
    shortURL: "b2xy52",
    longURL: "http://www.lighthouselabs.ca",
    userID: "test",
    totalViews: 3,
    uniqueViews: 2,
    dateCreated: 1492030283873,
    viewLog: [{
      timestamp: 1492038283873,
      visitor_id: "g56egr"
      },
      {
      timestamp: 1492048283873,
      visitor_id: "85mjgr"
      },
      {
      timestamp: 1492051283873,
      visitor_id: "g56egr"
      }
    ]
  },
  "9sm99K": {
    shortURL: "9sm99K",
    longURL: "http://www.google.com",
    userID: "test",
    totalViews: 0,
    uniqueViews: 0,
    dateCreated: 1492031283873,
    viewLog: [{
      timestamp: 1492038283879,
      visitor_id: "85mjgr"
      }
    ]
  }
};

function getURL (shortURL) {
  return urlDatabase[shortURL];
}

// require links to begin with http(s)
function addProtocol (longURL) {
  if (!longURL.match(/^http(s?):\/\//)) {
    longURL = "http://" + longURL;
  }
  return longURL;
}

function createURL (longURL, user_id) {
  const shortURL = generateRandomString();
  longURL = addProtocol(longURL);
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: longURL,
    userID: user_id,
    dateCreated: Date.now(),
    totalViews: 0,
    uniqueViews: 0,
    viewLog: []
  };
}

function editURL (shortURL, longURL) {
  urlDatabase[shortURL].longURL = longURL;
}

function deleteURL (shortURL) {
  delete urlDatabase[shortURL]
}

// filters urlDatabase by user_id
function urlsForUser (user_id) {
  output = {};
  for (url in urlDatabase) {
    if (urlDatabase[url].userID === user_id) {
      output[url] = urlDatabase[url];
    }
  }
  return output;
}

function trackView (shortURL, visitor_id) {
  let test = urlDatabase[shortURL].viewLog.find((visit) => {
    return visit.visitor_id === visitor_id;
  });
  if (!test) urlDatabase[shortURL].uniqueViews += 1;
  urlDatabase[shortURL].totalViews += 1;
  urlDatabase[shortURL].viewLog.push({
    timestamp: Date.now(),
    visitor_id: visitor_id
  });
}

function checkAccess (shortURL, user_id) {
  return user_id === urlDatabase[shortURL].userID;
}

module.exports = {
  urlService: {
    getURL,
    trackView,
    urlsForUser,
    createURL,
    editURL,
    deleteURL,
    checkAccess
  }
}