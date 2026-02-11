export function envOptional(key: string, defaultValue?: string): string | undefined {
    return process.env[key] ?? defaultValue;
}

export function envRequired(key: string): string {
    const v = process.env[key];
    if (!v) throw new Error(`Missing required env var: ${key}`);
    return v;
}
