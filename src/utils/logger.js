// src/utils/logger.js
import config from '../config/index.js';

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  fg: {
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    crimson: '\x1b[38m'
  },
  
  bg: {
    black: '\x1b[40m',
    red: '\x1b[41m',
    green: '\x1b[42m',
    yellow: '\x1b[43m',
    blue: '\x1b[44m',
    magenta: '\x1b[45m',
    cyan: '\x1b[46m',
    white: '\x1b[47m',
    crimson: '\x1b[48m'
  }
};

const logger = {
  enabled: config.logger?.enabled || true,
  level: config.logger?.level || 'info',
  
  levels: {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
    none: 4
  },
  
  shouldLog(level) {
    if (!this.enabled) return false;
    return this.levels[level] >= this.levels[this.level];
  },
  
  timestamp() {
    return new Date().toISOString();
  },
  
  debug(message, ...args) {
    if (this.shouldLog('debug')) {
      console.debug(`${COLORS.fg.cyan}[DEBUG]${COLORS.reset} ${this.timestamp()} - ${message}`, ...args);
    }
  },
  
  info(message, ...args) {
    if (this.shouldLog('info')) {
      console.info(`${COLORS.fg.blue}[INFO]${COLORS.reset} ${this.timestamp()} - ${message}`, ...args);
    }
  },
  
  warn(message, ...args) {
    if (this.shouldLog('warn')) {
      console.warn(`${COLORS.fg.yellow}[WARN]${COLORS.reset} ${this.timestamp()} - ${message}`, ...args);
    }
  },
  
  error(message, ...args) {
    if (this.shouldLog('error')) {
      console.error(`${COLORS.fg.red}[ERROR]${COLORS.reset} ${this.timestamp()} - ${message}`, ...args);
    }
  },
  
  success(message, ...args) {
    if (this.shouldLog('info')) {
      console.info(`${COLORS.fg.green}[SUCCESS]${COLORS.reset} ${this.timestamp()} - ${message}`, ...args);
    }
  },
  
  start(jobName) {
    if (this.shouldLog('info')) {
      console.info(`${COLORS.fg.magenta}[START]${COLORS.reset} ${this.timestamp()} - Starting job: ${jobName}`);
    }
  },
  
  end(jobName) {
    if (this.shouldLog('info')) {
      console.info(`${COLORS.fg.magenta}[END]${COLORS.reset} ${this.timestamp()} - Completed job: ${jobName}`);
    }
  }
};

export default logger;