const LOG_LEVELS = Object.freeze({
  silent: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
});

function normalizeLevel(level) {
  if (!level) return null;
  const key = String(level).trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(LOG_LEVELS, key) ? key : null;
}

function getDefaultLevel() {
  // CRA builds inline NODE_ENV; in prod we default to warn+.
  return process.env.NODE_ENV === 'production' ? 'warn' : 'debug';
}

function getConfiguredLevel() {
  const envLevel = normalizeLevel(process.env.REACT_APP_LOG_LEVEL);
  if (envLevel) return envLevel;

  // Allow a quick runtime override without rebuilding.
  try {
    const stored = normalizeLevel(window?.localStorage?.getItem('logLevel'));
    if (stored) return stored;
  } catch (_) {
    // ignore
  }

  return getDefaultLevel();
}

function getLevelValue(level) {
  const normalized = normalizeLevel(level) || getDefaultLevel();
  return LOG_LEVELS[normalized] ?? LOG_LEVELS.debug;
}

function formatPrefix({ level, namespace }) {
  const ts = new Date().toISOString();
  const ns = namespace ? ` ${namespace}` : '';
  return `[${ts}] ${level.toUpperCase()}${ns}`;
}

function safeSerialize(value) {
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  return value;
}

function writeToConsole(level, prefix, args) {
  // Keep console usage centralized.
  const safeArgs = args.map(safeSerialize);
  if (level === 'error') return console.error(prefix, ...safeArgs);
  if (level === 'warn') return console.warn(prefix, ...safeArgs);
  if (level === 'info') return console.info(prefix, ...safeArgs);
  return console.debug(prefix, ...safeArgs);
}

function baseLog(level, namespace, ...args) {
  const configuredValue = getLevelValue(getConfiguredLevel());
  const levelValue = getLevelValue(level);
  if (levelValue > configuredValue) return;

  const prefix = formatPrefix({ level, namespace });
  writeToConsole(level, prefix, args);
}

export function setLogLevel(level) {
  const normalized = normalizeLevel(level);
  if (!normalized) return false;
  try {
    window.localStorage.setItem('logLevel', normalized);
    return true;
  } catch (_) {
    return false;
  }
}

export function getLogLevel() {
  return getConfiguredLevel();
}

export function createLogger(namespace) {
  return {
    debug: (...args) => baseLog('debug', namespace, ...args),
    info: (...args) => baseLog('info', namespace, ...args),
    warn: (...args) => baseLog('warn', namespace, ...args),
    error: (...args) => baseLog('error', namespace, ...args),
  };
}

export const logger = createLogger('app');
