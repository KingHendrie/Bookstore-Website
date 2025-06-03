const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'app.log');

if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function writeLog(level, message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
  fs.appendFile(logFile, line, err => {
    if (err) {
      console.error('Failed to write to log file:', err);
    }
  });
}

module.exports = {
  info: (msg) => writeLog('info', msg),
  warn: (msg) => writeLog('warn', msg),
  error: (msg) => writeLog('error', msg),
};