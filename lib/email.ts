import { Resend } from 'resend';
import { loadEmailConfig } from './emailConfig';

let _client: Resend | null | undefined = undefined;

function client(): Resend | null {
  if (_client !== undefined) return _client;
  const cfg = loadEmailConfig();
  _client = cfg.resendKey ? new Resend(cfg.resendKey) : null;
  if (!_client) {
    console.warn('[email] RESEND_API_KEY missing — emails will be logged only.');
  }
  return _client;
}

type SendInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

async function sendRaw(input: SendInput): Promise<void> {
  const cfg = loadEmailConfig();
  const resend = client();
  if (!resend) {
    console.info('[email:dry]', { to: input.to, subject: input.subject });
    return;
  }
  try {
    await resend.emails.send({
      from: cfg.from,
      replyTo: cfg.replyTo,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  } catch (err) {
    console.error('[email:error]', err);
  }
}

/** Fire-and-forget wrapper — never block or throw into request handlers. */
export function sendAsync(input: SendInput): void {
  void sendRaw(input);
}

const BRAND = '#d64545';

function layout(body: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f0ea;font-family:Georgia,'Times New Roman',serif;color:#1d1b19;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f0ea;padding:32px 0;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#fdfbf7;border:1px solid #1d1b19;">
  <tr><td style="padding:18px 24px;border-bottom:1px solid #1d1b19;font-family:'Courier New',monospace;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;color:#1d1b19;">
    setlist · side&nbsp;a
  </td></tr>
  ${body}
  <tr><td style="padding:20px 24px;border-top:1px solid #1d1b19;font-family:'Courier New',monospace;font-size:11px;color:#6f6a63;">
    You're receiving this because you have an email on file at setlist.<br>
    Manage notifications in your <a href="__APP_URL__/settings" style="color:${BRAND};">settings</a>.
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function body(content: string): string {
  return `<tr><td style="padding:24px;font-size:15px;line-height:1.55;">${content}</td></tr>`;
}

function compile(html: string): string {
  const cfg = loadEmailConfig();
  return html.replaceAll('__APP_URL__', cfg.appUrl);
}

export function sendFriendRequestEmail(args: {
  to: string;
  requesterDisplay: string;
  requesterUsername: string;
}): void {
  const cfg = loadEmailConfig();
  const display = escapeHtml(args.requesterDisplay);
  const username = escapeHtml(args.requesterUsername);
  const html = compile(
    layout(
      body(
        `<p style="margin:0 0 14px;"><strong>${display}</strong> (@${username}) wants to be friends on setlist.</p>
         <p style="margin:0 0 22px;">Accept to share diary entries and see what they're spinning.</p>
         <p style="margin:0;"><a href="${cfg.appUrl}/${username}/friends" style="display:inline-block;padding:10px 18px;background:${BRAND};color:#fff;text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Review request</a></p>`
      )
    )
  );
  sendAsync({
    to: args.to,
    subject: `${args.requesterDisplay} wants to be friends on setlist`,
    html,
    text: `${args.requesterDisplay} (@${args.requesterUsername}) sent you a friend request on setlist. ${cfg.appUrl}/${args.requesterUsername}/friends`,
  });
}

export function sendFriendAcceptedEmail(args: {
  to: string;
  accepterDisplay: string;
  accepterUsername: string;
}): void {
  const cfg = loadEmailConfig();
  const display = escapeHtml(args.accepterDisplay);
  const username = escapeHtml(args.accepterUsername);
  const html = compile(
    layout(
      body(
        `<p style="margin:0 0 14px;"><strong>${display}</strong> (@${username}) accepted your friend request.</p>
         <p style="margin:0;"><a href="${cfg.appUrl}/${username}" style="display:inline-block;padding:10px 18px;background:${BRAND};color:#fff;text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Visit their diary</a></p>`
      )
    )
  );
  sendAsync({
    to: args.to,
    subject: `${args.accepterDisplay} accepted your friend request`,
    html,
    text: `${args.accepterDisplay} (@${args.accepterUsername}) accepted. ${cfg.appUrl}/${args.accepterUsername}`,
  });
}

export function sendPasswordResetEmail(args: {
  to: string;
  username: string;
  token: string;
}): void {
  const cfg = loadEmailConfig();
  const link = `${cfg.appUrl}/reset-password?token=${encodeURIComponent(args.token)}`;
  const html = compile(
    layout(
      body(
        `<p style="margin:0 0 14px;">Hi <strong>${escapeHtml(args.username)}</strong>,</p>
         <p style="margin:0 0 14px;">Someone asked to reset your setlist password. This link expires in 1 hour and can only be used once.</p>
         <p style="margin:0 0 22px;"><a href="${link}" style="display:inline-block;padding:10px 18px;background:${BRAND};color:#fff;text-decoration:none;font-family:'Courier New',monospace;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;">Set new password</a></p>
         <p style="margin:0;font-size:12px;color:#6f6a63;">If you didn't ask for this, ignore this email — your password won't change.</p>`
      )
    )
  );
  sendAsync({
    to: args.to,
    subject: 'Reset your setlist password',
    html,
    text: `Reset your setlist password: ${link} (expires in 1 hour). If you didn't request this, ignore.`,
  });
}

