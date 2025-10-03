const DEV_DB_TIMEOUT = 1200;
const PROD_DB_TIMEOUT = 2500;

const DEFINED_DB_TIMEOUT = process.env.NEXT_PUBLIC_DB_TIMEOUT
  ? Number(process.env.NEXT_PUBLIC_DB_TIMEOUT)
  : undefined;

export const DB_TIMEOUT_MS = Number.isFinite(DEFINED_DB_TIMEOUT)
  ? Number(DEFINED_DB_TIMEOUT)
  : process.env.NODE_ENV === "production"
  ? PROD_DB_TIMEOUT
  : DEV_DB_TIMEOUT;

const DEFAULT_ADMIN_TIMEOUT = process.env.NODE_ENV === "production" ? Math.max(DB_TIMEOUT_MS * 2, 5000) : Math.max(DB_TIMEOUT_MS * 2, 2500);

const DEFINED_ADMIN_TIMEOUT = process.env.NEXT_PUBLIC_ADMIN_TIMEOUT
  ? Number(process.env.NEXT_PUBLIC_ADMIN_TIMEOUT)
  : undefined;

export const ADMIN_TIMEOUT_MS = Number.isFinite(DEFINED_ADMIN_TIMEOUT)
  ? Number(DEFINED_ADMIN_TIMEOUT)
  : DEFAULT_ADMIN_TIMEOUT;
