export type MemoryTag =
    | "profile"
    | "preferences"
    | "project"
    | "policy"
    | "security"
    | "finance"
    | "devops"
    | "openclaw"
    | "whatsapp"
    | "research"
    | "decision"
    | "open_item";

export function inferTags(text: string): MemoryTag[] {
    const t = (text || "").toLowerCase();
    const tags: MemoryTag[] = [];
    if (t.includes("openclaw")) tags.push("openclaw");
    if (t.includes("whatsapp")) tags.push("whatsapp");
    if (t.includes("policy") || t.includes("approval")) tags.push("policy");
    if (t.includes("security") || t.includes("jailbreak") || t.includes("malware")) tags.push("security");
    if (t.includes("budget") || t.includes("cost") || t.includes("token")) tags.push("finance");
    if (t.includes("deploy") || t.includes("service") || t.includes("windows")) tags.push("devops");
    if (tags.length === 0) tags.push("project");
    return Array.from(new Set(tags));
}
