import { SuperSendTX } from "supersendtx";

const SANDBOX_FROM = "noreply@mail.supersendtx.com";
const PRODUCTION_FROM = "Biblioteca Legal <noreply@bibliotecalegalhn.com>";
const SANDBOX_TO = "soporte@bibliotecalegalhn.com";
const DEFAULT_REPLY_TO = "soporte@bibliotecalegalhn.com";

export const supersendtx = new SuperSendTX(
  process.env.SUPERSENDTX_API_KEY ?? ""
);

export function isSendingDomainVerified(): boolean {
  return process.env.SUPERSENDTX_DOMAIN_VERIFIED === "true";
}

export function getAppBaseUrl(): string {
  const url = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "";
  if (!url) return "http://localhost:3000";
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url.replace(/\/$/, "");
  }
  return `https://${url.replace(/\/$/, "")}`;
}

export type TransactionalEmailParams = {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  react?: unknown;
  reply_to?: string;
};

/** Auth-related transactional sends (verification, magic links, password reset). */
export async function sendTransactionalEmail(params: TransactionalEmailParams) {
  const from = isSendingDomainVerified() ? PRODUCTION_FROM : SANDBOX_FROM;
  const to = isSendingDomainVerified()
    ? params.to
    : SANDBOX_TO;

  return supersendtx.emails.send({
    from,
    to,
    subject: params.subject,
    html: params.html,
    text: params.text,
    react: params.react,
    reply_to: params.reply_to ?? DEFAULT_REPLY_TO,
  });
}
