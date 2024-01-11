const sendTgMsg = require('./sendTgMsg');
const config = require('../../config/config');
const logger = require('./logger');

async function handleError(
  moduleName,
  text, 
  error, 
  additionalTextForLogger = null
) {
  const errorMsg =
    `Error in ${moduleName} (${config.microserviceName})\n` +
    `${text}\n` + `Error: ${error.message}`
  
  if (additionalTextForLogger) {
    logger.error(errorMsg + `\n${additionalTextForLogger}`);
  } else {
    logger.error(errorMsg);
  }

  sendTgMsg(errorMsg, config.extraAttentionChatId);
}

module.exports = handleError;

