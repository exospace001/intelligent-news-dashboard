const crypto = require('crypto');

// Simple basic auth middleware
function basicAuth(username, password) {
  return (req, res, next) => {
    const auth = req.headers.authorization;
    
    if (!auth || !auth.startsWith('Basic ')) {
      res.setHeader('WWW-Authenticate', 'Basic realm="News Dashboard"');
      return res.status(401).send('Authentication required');
    }
    
    const base64Credentials = auth.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [user, pass] = credentials.split(':');
    
    if (user === username && pass === password) {
      next();
    } else {
      res.setHeader('WWW-Authenticate', 'Basic realm="News Dashboard"');
      return res.status(401).send('Invalid credentials');
    }
  };
}

module.exports = { basicAuth };