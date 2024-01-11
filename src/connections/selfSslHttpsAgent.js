const https = require('https');
const selfSslHttpsAgent = new https.Agent({ // Need to verify self-signed ssl certificate
  rejectUnauthorized: false
});

module.exports = selfSslHttpsAgent;