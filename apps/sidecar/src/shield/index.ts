import { redactSecrets } from "./redact.js";
import { redactPII } from "./pii.js";
import { looksLikePromptInjection } from "./injection.js";
import { rateLimitOk } from "./ratelimit.js";
import { envOptional } from "../util/env.js";

export function inboundShield(userE164: string, text: string): { ok: boolean; reason?: string } {
    const rl = rateLimitOk(userE164);
    if (!rl.ok) return { ok: false, reason: "Rate limit exceeded. Try again in a minute." };
    // soft signal only
    if (looksLikePromptInjection(text)) return { ok: true };
    return { ok: true };
}

export function outboundShield(text: string): { text: string; warnings: string[] } {
    const warnings: string[] = [];
    let out = text;

    const r1 = redactSecrets(out);
    if (r1.redacted) warnings.push("Redacted possible secret material.");
    out = r1.text;

    const r2 = redactPII(out);
    if (r2.redacted) warnings.push("Redacted possible PII.");
    out = r2.text;

    // WhatsApp maximum friendliness (trim weird control chars)
    out = out.replace(/\u0000/g, "").trim();

    return { text: out, warnings };
}
