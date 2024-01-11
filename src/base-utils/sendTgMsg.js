const { Telegraf } = require('telegraf');
const config = require('../../config/config');
const logger = require('./logger');

const bot = new Telegraf(config.telegramBotToken);

async function sendTgMsg(message, chatId = config.telegramChatId) {
  try {
    await bot.telegram.sendMessage(chatId, message, { 
      parse_mode: 'HTML',
      disable_web_page_preview: true
    });
  } catch (error) {
    logger.error(`Can not send message to telegram. Error: ${error}`);
  }
};

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = sendTgMsg;