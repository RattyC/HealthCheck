type LogLevel = "info" | "warn" | "error";

type LogMeta = Record<string, unknown> | undefined;

type LogMethod = (message: string, meta?: LogMeta) => void;

function emit(level: LogLevel, message: string, meta?: LogMeta) {
  const payload = meta ? { message, ...meta } : { message };
  const formatted = JSON.stringify(payload);
  if (level === "error") {
    console.error(`[${level.toUpperCase()}] ${formatted}`);
  } else if (level === "warn") {
    console.warn(`[${level.toUpperCase()}] ${formatted}`);
  } else {
    console.log(`[${level.toUpperCase()}] ${formatted}`);
  }
}

export const logger: Record<LogLevel, LogMethod> = {
  info: (message, meta) => emit("info", message, meta),
  warn: (message, meta) => emit("warn", message, meta),
  error: (message, meta) => emit("error", message, meta),
};
