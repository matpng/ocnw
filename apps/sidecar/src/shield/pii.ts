/**
 * Basic PII redaction (v1) — expand for your PNG contexts.
 * This is intentionally conservative.
 */
const PII_PATTERNS: Array<{ name: string; re: RegExp }> = [
    { name: "email", re: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
    { name: "credit_card_like", re: /\b(?:\d[ -]*?){13,19}\b/g },
    { name: "iban_like", re: /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/gi }
];

export function redactPII(text: string): { text: string; redacted: boolean } {
    let out = text;
    let redacted = false;
    for (const p of PII_PATTERNS) {
        if (p.re.test(out)) {
            out = out.replace(p.re, "[REDACTED_PII]");
            redacted = true;
        }
    }
    return { text: out, redacted };
}
