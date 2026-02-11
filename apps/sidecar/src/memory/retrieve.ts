import { DistilledMemory } from "./schema.js";
import { MemoryTag, inferTags } from "./tags.js";

/**
 * Context-on-demand: select relevant portions of distilled memory.
 * This avoids injecting the entire state every turn.
 */
export function retrieveContext(mem: DistilledMemory, userText: string): any {
    const tags = inferTags(userText);

    // Always include constraints + open items (small)
    const base = {
        constraints: mem.constraints,
        open_items: mem.open_items
    };

    // Selective: include only relevant slices
    const includeProfile = tags.includes("profile") || tags.includes("preferences");
    const includeSecurity = tags.includes("security");
    const includeDevops = tags.includes("devops");
    const includeOpenClaw = tags.includes("openclaw") || tags.includes("whatsapp");
    const includeFinance = tags.includes("finance");

    const ctx: any = { ...base, tags };

    if (includeProfile) ctx.user_profile = mem.user_profile;
    if (includeOpenClaw) ctx.current_task = mem.current_task;
    if (includeSecurity) ctx.decisions = mem.decisions.filter(d => d.toLowerCase().includes("security"));
    if (includeDevops) ctx.decisions = (ctx.decisions ?? []).concat(mem.decisions.filter(d => d.toLowerCase().includes("deploy")));
    if (includeFinance) ctx.decisions = (ctx.decisions ?? []).concat(mem.decisions.filter(d => d.toLowerCase().includes("budget")));

    // Keep tiny
    if (ctx.decisions && ctx.decisions.length > 10) ctx.decisions = ctx.decisions.slice(-10);

    return ctx;
}
