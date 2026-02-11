import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import { emptyPluginConfigSchema } from "openclaw/plugin-sdk";
import { createWhatsAppPlugin } from "./src/channel.ts";

const plugin = {
  id: "whatsapp",
  name: "WhatsApp",
  description: "WhatsApp channel plugin",
  configSchema: emptyPluginConfigSchema(),
  register(api: OpenClawPluginApi) {
    const channelPlugin = createWhatsAppPlugin(api.runtime);
    api.registerChannel({ plugin: channelPlugin });
  },
};

export default plugin;
