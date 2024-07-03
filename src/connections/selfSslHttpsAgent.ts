import https from 'https';

export const selfSslHttpsAgent = new https.Agent({ // Need to verify self-signed ssl certificate
  rejectUnauthorized: false
});