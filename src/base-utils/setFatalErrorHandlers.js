const sendTgMsg = require('./sendTgMsg');
const logger = require('./logger');
const config = require('../../config/config');

function setFatalErrorHandlers() {

  process.on('uncaughtException', (error) => {
      logger.error(`Uncaught exception. Error: ${error}`);
      sendTgMsg(
        `Module ${config.microserviceName} died`, config.extraAttentionChatId
      ).then(() => process.exit(1));
  });

  process.on('unhandledRejection', (reason, promise) => {
      logger.error(
        `Unhandled promise rejection, promise ${JSON.stringify(promise)} reason ${reason}`
      );
      sendTgMsg(
        `Module ${config.microserviceName} died`, config.extraAttentionChatId
      ).then(() => process.exit(1));
  });
}

module.exports = setFatalErrorHandlers;