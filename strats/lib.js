const winston = require("winston");
const path = require("path");

// Define the log directory
const logDir = path.join(__dirname, "..", "logs");
console.log("logDir ", logDir);
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
  return ` ${timestamp} : ${level} ${message}`;
});

// Create a Winston logger instance
const logger = winston.createLogger({
  level: "info", // Set the logging level (e.g., 'info', 'warn', 'error', 'debug')
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      // Log to console
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        logFormat
      ),
    }),
    new winston.transports.File({ filename: path.join(logDir, "app.log") }), // Log to file
  ],
});

module.exports = logger;
