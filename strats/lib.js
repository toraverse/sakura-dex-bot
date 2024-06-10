const winston = require("winston");
const path = require("path");

// Define the log directory
const logDir = path.join(__dirname, "logs");

// Create a Winston logger instance
const logger = winston.createLogger({
  level: "info", // Set the logging level (e.g., 'info', 'warn', 'error', 'debug')
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.printf(
      (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
  ),
  transports: [
    new winston.transports.Console({
      // Log to console
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: path.join(logDir, "app.log") }), // Log to file
  ],
});

module.exports = logger;
