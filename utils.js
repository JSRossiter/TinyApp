// generates random 6 character alphanumeric string
function generateRandomString () {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let result = '';
  for (var i = 0; i < 6; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

module.exports = {generateRandomString};