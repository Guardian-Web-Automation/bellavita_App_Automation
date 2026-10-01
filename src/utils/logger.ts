import winston from 'winston'

/**
 * Winston logger — matches the web framework's logging approach.
 * Console + file transport under ./reports/.
 */
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}] ${message}`)
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: './reports/automation.log' })
  ]
})
