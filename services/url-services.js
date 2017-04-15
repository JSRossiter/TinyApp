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
      visitorId: "g56egr"
    },
    {
      timestamp: 1492048283873,
      visitorId: "85mjgr"
    },
    {
      timestamp: 1492051283873,
      visitorId: "g56egr"
    }
    ]
  },
  "9sm99K": {
    shortURL: "9sm99K",
    longURL: "http://www.google.com",
    userID: "test",
    totalViews: 1,
    uniqueViews: 1,
    dateCreated: 1492031283873,
    viewLog: [{
      timestamp: 1492038283879,
      visitorId: "85mjgr"
    }
    ]
  }
};

function getURL (shortURL) {
  return urlDatabase[shortURL];
}

// require links to begin with http(s)
function addProtocol (longURL) {
  let newURL = longURL;
  if (!newURL.match(/^http(s?):\/\//)) {
    newURL = "http://" + newURL;
  }
  return newURL;
}

function createURL (longURL, userID) {
  const shortURL = generateRandomString();
  newLongURL = addProtocol(longURL);
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: newLongURL,
    userID: userID,
    dateCreated: Date.now(),
    totalViews: 0,
    uniqueViews: 0,
    viewLog: []
  };
  return shortURL;
}

function editURL (shortURL, longURL) {
  urlDatabase[shortURL].longURL = longURL;
}

function deleteURL (shortURL) {
  delete urlDatabase[shortURL];
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

function trackView (shortURL, visitorId) {
  let test = urlDatabase[shortURL].viewLog.find((visit) => {
    return visit.visitorId === visitorId;
  });
  if (!test) {
    urlDatabase[shortURL].uniqueViews += 1;
  }
  urlDatabase[shortURL].totalViews += 1;
  urlDatabase[shortURL].viewLog.push({
    timestamp: Date.now(),
    visitorId: visitorId
  });
}

function checkAccess (shortURL, userID) {
  return userID === urlDatabase[shortURL].userID;
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
};