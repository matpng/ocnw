import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceDir = path.resolve(__dirname, "..");
// Use relative path for import to work with tsx/node resolution if possible,
// or absolute path if tsx supports it.
// Windows paths might be tricky with import(), so we use file:// URL.
const extensionPath = path.join(workspaceDir, "extensions/whatsapp/index.ts");
const extensionUrl = `file://${extensionPath.replace(/\\/g, "/")}`;

console.log("Loading plugin from:", extensionUrl);

try {
  const mod = await import(extensionUrl);
  console.log("Plugin loaded successfully.");

  const plugin = mod.default;
  if (!plugin) {
    console.error("No default export found!");
    process.exit(1);
  }
  console.log("Plugin ID:", plugin.id);

  // Mock Runtime
  const mockRuntime = {
    channel: {
      whatsapp: {
        createLoginTool: () => ({}),
        webAuthExists: async () => true,
        getWebAuthAgeMs: () => 0,
        readWebSelfId: () => ({}),
        monitorWebChannel: async () => {},
        startWebLoginWithQr: async () => {},
        waitForWebLogin: async () => {},
        logoutWeb: async () => {},
        handleWhatsAppAction: async () => {},
        sendMessageWhatsApp: async () => {},
        sendPollWhatsApp: async () => {},
      },
      text: {
        chunkText: () => [],
      },
    },
    logging: {
      shouldLogVerbose: () => true,
    },
  };

  const mockApi = {
    runtime: mockRuntime,
    registerChannel: (channel: any) => {
      console.log("registerChannel called for:", channel.plugin.id);
      // Try to access properties that might trigger the runtime check
      console.log("Capabilities:", channel.plugin.capabilities);

      // Mimic what the gateway does - access agentTools
      if (channel.plugin.agentTools) {
        console.log("Invoking agentTools...");
        try {
          const tools = channel.plugin.agentTools();
          console.log("agentTools returned:", tools.length, "tools");
        } catch (e) {
          console.error("Failed to invoke agentTools:", e);
        }
      }
    },
  };

  console.log("Registering plugin...");
  plugin.register(mockApi);
  console.log("Plugin registered successfully.");
} catch (error) {
  console.error("Error loading/registering plugin:", error);
  process.exit(1);
}
