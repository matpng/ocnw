import { MissionContract } from "../autonomy/contracts.js";

/**
 * Bridge to OpenClaw AI Agent.
 * Since we are running in-process (Option B), we might be able to invoke the agent directly.
 * For now, this is a mock to show the flow.
 */
export async function callAgent(input: {
    goal: string;
    observations: any[];
    contract: MissionContract;
}): Promise<{ text: string; tool_calls?: any[] }> {
    const goalLower = input.goal.toLowerCase();
    console.log(`[Sidecar] Agent thinking... goal="${input.goal}" step=${input.observations.length}`);

    // Deterministic behaviors for verification
    if (goalLower.includes("weather") || goalLower.includes("search")) {
        // Step 0: Plan to search
        if (input.observations.length === 0) {
            return {
                text: "I will search for that information.",
                tool_calls: [{ name: "research.search", args: { query: input.goal } }]
            };
        }
        // Step 1: React to search result
        const lastObs = input.observations[input.observations.length - 1];
        if (lastObs.type === "tool_result" && lastObs.name === "research.search") {
            return {
                text: `Based on my research, here is what I found: ${JSON.stringify(lastObs.result).slice(0, 100)}...`,
                tool_calls: []
            };
        }
    }

    if (goalLower.includes("time")) {
        return {
            text: `The current time is ${new Date().toLocaleTimeString()}.`,
            tool_calls: []
        };
    }

    if (goalLower.includes("read file") || goalLower.includes("fs.read")) {
        if (input.observations.length === 0) {
            return {
                text: "I'll read the request file.",
                tool_calls: [{ name: "fs.read", args: { path: "README.md" } }] // defaults to allowed root
            };
        }
    }

    // Default fallback
    if (input.observations.length === 0) {
        return {
            text: "I am ready to help. Please give me a specific command like 'search for X' or 'time'.",
            tool_calls: []
        };
    }

    return {
        text: "Mission completed.",
        tool_calls: []
    };
}
