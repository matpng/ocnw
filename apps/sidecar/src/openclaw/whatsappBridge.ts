/**
 * OPTION B: Integrate with your existing OpenClaw WhatsApp connector.
 *
 * You must wire:
 * - onIncomingWhatsAppMessage(...) -> call Sidecar core handler
 * - and return or send reply via OpenClaw's connector
 *
 * If OpenClaw already handles WhatsApp replies, just return { reply_text }.
 * If OpenClaw requires a send call, implement sendReplyViaOpenClaw(...) below.
 */

import { runMission } from "../autonomy/runner.js";
import { defaultContract } from "../autonomy/contracts.js";
import { callAgent } from "./client.js";
import { registerTool, allowedRoot } from "../tools/registry.js";
import { webSearch, webOpen, webExtract } from "../tools/webTools.js";
import { fsRead, fsWrite } from "../tools/fsTools.js";
import { safeExec } from "../tools/execTools.js";
import { outboundShield } from "../shield/index.js";

// Register default tools
registerTool({ name: "research.search", fn: webSearch, timeoutMs: 10000 });
registerTool({ name: "research.open", fn: webOpen, timeoutMs: 10000 });
registerTool({ name: "research.extract", fn: webExtract, timeoutMs: 10000 });
registerTool({ name: "fs.read", fn: fsRead, timeoutMs: 2000 });
registerTool({ name: "fs.write", fn: fsWrite, timeoutMs: 2000 });
registerTool({ name: "safe.exec", fn: safeExec, timeoutMs: 10000 });
// Mock memory tools for now
registerTool({ name: "memory.read", fn: async () => ({ ok: true, data: {} }), timeoutMs: 1000 });
registerTool({ name: "memory.write", fn: async () => ({ ok: true }), timeoutMs: 1000 });

export type OpenClawWhatsAppInbound = {
    message_id: string;
    from_e164: string;
    timestamp_ms: number;
    text: string;
    raw?: any;
};

export async function onIncomingWhatsAppMessage(ev: OpenClawWhatsAppInbound): Promise<{ reply_text: string }> {
    // Check for auto commands
    const text = ev.text.trim();
    let level: "Auto-1" | "Auto-2" | "Auto-3" | undefined;
    let goal = "";

    if (text.startsWith("auto1: ")) {
        level = "Auto-1";
        goal = text.substring(7);
    } else if (text.startsWith("auto2: ")) {
        level = "Auto-2";
        goal = text.substring(7);
    } else if (text.startsWith("auto3: ")) {
        level = "Auto-3";
        goal = text.substring(7);
    } else {
        // Normal message, pass through or handle basic
        return { reply_text: "" }; // No reply = passthrough
    }

    const contract = defaultContract({
        missionId: `mission-${Date.now()}`,
        userE164: ev.from_e164,
        goal,
        level
    });

    const result = await runMission({
        contract,
        callAgent,
        toolCtx: {
            userE164: ev.from_e164,
            mode: level,
            allowedRoot: allowedRoot()
        },
        requestApproval: async (name, payload) => {
            // Auto-approve for now or ask via reply?
            // For Option B simple integration, we'll auto-deny if unsupervised, or mock approval
            return "DENIED";
        }
    });

    const shieldOut = outboundShield(result.summary);
    return { reply_text: `[${level} Mission]\n${shieldOut.text}\n(Warnings: ${shieldOut.warnings.join(", ")})` };
}

// If needed:
export async function sendReplyViaOpenClaw(to_e164: string, text: string): Promise<void> {
    // TODO: call your OpenClaw connector API to send WhatsApp message
}
