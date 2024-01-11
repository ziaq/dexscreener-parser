const handleError = require('./handleError');
const logger = require('./logger');

let errorSent = false;
let errorTimeout;
let resetErrorSentTimeout;

function listenRedisStatus(redisClient, redisInstanceName) {
  redisClient.on('ready', () => {
    logger.info(`Connected to Redis ${redisInstanceName}`);
    clearTimeout(errorTimeout);
    errorSent = false;
    clearTimeout(resetErrorSentTimeout);
  });

  redisClient.on('error', (error) => {
    if (errorSent) return;

    errorSent = true;
    resetErrorSentTimeout = setTimeout(() => {
      errorSent = false;
    }, 600000);

    errorTimeout = setTimeout(() => {
      handleError(
        'listenRedisStatus',
        `Connection failed ${redisInstanceName}`,
        error,
      );
    }, 15000); // Sends an error if the connection is not re-established in 15 seconds

  });
}

module.exports = listenRedisStatus;