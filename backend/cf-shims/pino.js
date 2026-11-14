// Workers-safe stand-in for pino (its browser build is picked up by the bundler and breaks pino-http).
const LEVELS = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60, silent: Infinity };
function make(opts = {}, bindings = {}) {
  const min = LEVELS[opts.level || "info"] ?? 30;
  const log = {};
  for (const [name, lvl] of Object.entries(LEVELS)) {
    if (name === "silent") continue;
    log[name] = (obj, msg) => {
      if (lvl < min) return;
      const fn = lvl >= 50 ? console.error : lvl >= 40 ? console.warn : console.log;
      if (typeof obj === "string") fn(JSON.stringify({ level: name, ...bindings, msg: obj }));
      else fn(JSON.stringify({ level: name, ...bindings, msg, ...(obj?.err ? { err: String(obj.err?.stack || obj.err) } : {}) }));
    };
  }
  log.level = opts.level || "info";
  log.child = (b) => make(opts, { ...bindings, ...b });
  log.isLevelEnabled = (l) => (LEVELS[l] ?? 0) >= min;
  return log;
}
export default function pino(opts) { return make(opts, opts?.base || {}); }
export { pino };
export const stdSerializers = { err: (e) => e, req: (r) => r, res: (r) => r };
export function pinoHttp(opts = {}) {
  const logger = opts.logger || make();
  return (req, res, next) => {
    req.log = logger; res.log = logger; const t = Date.now();
    res.on("finish", () => logger.info({}, `${req.method} ${req.originalUrl || req.url} ${res.statusCode} ${Date.now() - t}ms`));
    next();
  };
}
