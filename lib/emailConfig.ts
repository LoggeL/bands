import { readFileSync, existsSync } from 'fs';
import path from 'path';

/**
 * Canonical source of truth for RESEND_API_KEY is the sibling jpCore project
 * (C:\Users\Logge\Desktop\jpCore\.env). This loader lets setlist read it from
 * there without duplicating the secret. Process env still wins — production
 * can set the vars directly.
 */
let _loaded = false;

function parseDotenv(contents: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const raw of contents.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function tryLoadFromJpCore(): void {
  const candidates = [
    path.resolve(process.cwd(), '..', 'jpCore', '.env'),
    path.resolve(process.cwd(), '..', 'jpcore', '.env'),
  ];
  for (const p of candidates) {
    if (!existsSync(p)) continue;
    try {
      const parsed = parseDotenv(readFileSync(p, 'utf8'));
      for (const key of ['RESEND_API_KEY', 'EMAIL_FROM', 'EMAIL_REPLY_TO'] as const) {
        if (!process.env[key] && parsed[key]) {
          process.env[key] = parsed[key];
        }
      }
      return;
    } catch {
      // ignore: fall through to next candidate
    }
  }
}

export function loadEmailConfig(): {
  resendKey: string | null;
  from: string;
  replyTo: string | undefined;
  appUrl: string;
  cronSecret: string | null;
} {
  if (!_loaded) {
    tryLoadFromJpCore();
    _loaded = true;
  }
  return {
    resendKey: process.env.RESEND_API_KEY || null,
    from: process.env.EMAIL_FROM || 'setlist <noreply@logge.top>',
    replyTo: process.env.EMAIL_REPLY_TO || undefined,
    appUrl: process.env.APP_URL || 'http://localhost:3000',
    cronSecret: process.env.CRON_SECRET || null,
  };
}
