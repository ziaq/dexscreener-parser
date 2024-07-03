import { createLogger, format, transports, Logger } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const { combine, timestamp, printf } = format;

interface CustomLogger {
  info: (message: string) => void;
  error: (message: string) => void;
  details: (message: string) => void;
}

const customFormat = (customLabel: string) => printf(({ timestamp, level, message }) => {
  const date = new Date(timestamp);
  const formattedTimestamp = 
    `${date.toLocaleString('ru-RU', { hour12: false })} :${String(date.getMilliseconds()).padStart(3, '0')}`;
    
  return `${formattedTimestamp} ${level} [${customLabel}]: ${message}`;
});

const detailsTransports = [
  new DailyRotateFile({
    filename: 'logs/details-%DATE%.log',
    datePattern: 'DD-MM-YYYY',
    maxSize: '10m',
    maxFiles: '3d',
    level: 'info',
  }),
];

const appTransports = [
  new DailyRotateFile({
    filename: 'logs/app-%DATE%.log',
    datePattern: 'DD-MM-YYYY',
    maxSize: '10m',
    maxFiles: '3d',
    level: 'info',
  }),
  new transports.Console({
    level: 'info',
  }),
];

const createCustomLabelLogger = (
  customLabel: string, 
  loggerTransports: Array<transports.ConsoleTransportInstance | DailyRotateFile>
): Logger => createLogger({
  format: combine(timestamp(), customFormat(customLabel)),
  transports: loggerTransports,
});

const loggers = {
  info: createCustomLabelLogger('info', appTransports),
  error: createCustomLabelLogger('error', appTransports),
  details: createCustomLabelLogger('details', detailsTransports),
};

export const logger: CustomLogger = {
  info: loggers.info.info.bind(loggers.info),
  error: loggers.error.error.bind(loggers.error),
  details: loggers.details.info.bind(loggers.details),
};