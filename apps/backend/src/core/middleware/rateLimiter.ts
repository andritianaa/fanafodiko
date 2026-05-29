import { rateLimiter } from "hono-rate-limiter";
import type { Context } from "hono";

/**
 * Détermine la clé de rate-limit.
 * Priorité : x-forwarded-for (derrière un reverse-proxy) → CF-Connecting-IP → IP directe.
 */
function keyFromIp(c: Context): string {
  return (
    c.req.header("x-forwarded-for")?.split(",")[0].trim() ??
    c.req.header("cf-connecting-ip") ??
    c.req.header("x-real-ip") ??
    "unknown"
  );
}

// ─── Limites par palier ────────────────────────────────────────────────────────

/**
 * Routes d'authentification (login, register, forgot-password).
 * Fenêtre de 15 min / 10 tentatives max par IP.
 * Protège contre le brute-force de mots de passe.
 */
export const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-6",
  keyGenerator: keyFromIp,
  message: {
    code: "TOO_MANY_REQUESTS",
    message: "Trop de tentatives. Réessayez dans 15 minutes.",
  },
});

/**
 * Toutes les routes API authentifiées (ménage, médicaments, notifications…).
 * Fenêtre de 1 min / 60 requêtes par IP, confortable pour un usage normal.
 */
export const apiLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: "draft-6",
  keyGenerator: keyFromIp,
  message: {
    code: "TOO_MANY_REQUESTS",
    message: "Trop de requêtes. Réessayez dans une minute.",
  },
});

/**
 * Upload de fichiers, plus restrictif car coûteux en CPU/stockage.
 * Fenêtre de 1 min / 10 uploads par IP.
 */
export const uploadLimiter = rateLimiter({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: "draft-6",
  keyGenerator: keyFromIp,
  message: {
    code: "TOO_MANY_REQUESTS",
    message: "Trop d'uploads. Réessayez dans une minute.",
  },
});
