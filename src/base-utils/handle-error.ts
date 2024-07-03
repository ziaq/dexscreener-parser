import { config } from '../../config';
import { logger } from './logger';
import { sendTgMsg } from './send-tg-msg';

export async function handleError(
  moduleName: string,
  text: string,
  error: Error | { message: string },
  additionalTextForLogger?: string
): Promise<void> {
  const errorMsg = `Error in ${moduleName} (${config.microserviceName}). ${text}. Error: ${error.message}`;
  
  if (additionalTextForLogger) {
    logger.error(`${errorMsg}\n${additionalTextForLogger}`);
  } else {
    logger.error(errorMsg);
  }

  sendTgMsg(errorMsg, config.extraAttentionChatId);
}

